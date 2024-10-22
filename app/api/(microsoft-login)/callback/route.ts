import { CalendarTypes } from "@/constants/calendarTypes";
import connect from "@/lib/db";
import { msalConfig } from "@/lib/microsoftClient";
import Calendar from "@/lib/models/calendar";
import Plan from "@/lib/models/plan";
import User from "@/lib/models/user";
import { encrypt } from "@/utils/crypto";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Types } from "mongoose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const cca = new ConfidentialClientApplication(msalConfig);

export async function GET(req: NextRequest) {
  const code: string = req.nextUrl.searchParams.get("code") as string;

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?error=user denied access!`
    );
  }
  try {
    const cookieStore = cookies();
    // fetch the user details from the cookie store
    const userData = JSON.parse(cookieStore.get("userData")?.value || "{}");
    // fetch the calendar name for the cookie store
    const calendarName = cookieStore.get("calendarName")?.value;

    // establish the connection with database
    await connect();

    // load all plans
    await Plan.find({});

    // check if the store exists in the database
    const selectedUser = await User.findById(userData._id).populate({
      path: "plan",
      select: ["_id", "planId", "name", "numberOfCalendarsAllowed"],
    });
    if (!selectedUser) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?error=User does not exist!`
      );
    }

    // fetch all the calendars of the user
    const calendars = await Calendar.find({
      user: new Types.ObjectId(selectedUser._id),
    });

    // check if the user is allowed to import the calendar based on the plan
    if (calendars.length >= selectedUser?.plan?.numberOfCalendarsAllowed) {
      // delete the calendar name from the cookies
      cookieStore.delete("calendarName");
      // throw an error stating that user does not enough credits to import
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?error=user does not have enough credits to import this calendar. Please upgrade your plan to import more calendars!`
      );
    }

    // get the user details from the code
    const result = await cca.acquireTokenByCode({
      code,
      scopes: ["User.Read", "Calendars.Read"],
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`,
    });

    // extract the name, email, access token and expiry from result
    const { account, accessToken, expiresOn } = result;

    // check if the calendar exists in the database
    const selectedCalendar = await Calendar.findOne({
      email: account?.username,
      user: new Types.ObjectId(selectedUser._id),
      provider: CalendarTypes.OUTLOOK,
    });

    // if the calendar exists in the database
    if (selectedCalendar) {
      // delete the calendar name from the cookies
      cookieStore.delete("calendarName");
      // throw an error stating that the calendar is already in the database
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?error=user's calendar is already imported!`
      );
    }

    // excrypt the access token and refresh token
    const access_token = encrypt(accessToken);

    // fetch refresh token

    const refreshToken = () => {
      const tokenCache = cca.getTokenCache().serialize();
      const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
      const refreshToken =
        refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
      return refreshToken;
    };

    const refresh_token = encrypt(refreshToken());

    // add a new calendar in the database
    // create the new calendar object
    // assign user id to the calendar
    const newCalendar = new Calendar({
      name: calendarName,
      email: account?.username,
      access_token,
      refresh_token,
      provider: CalendarTypes.OUTLOOK,
      expires_at: expiresOn,
      user: new Types.ObjectId(selectedUser._id),
    });

    // save the info in the dabatabse
    await newCalendar.save();

    // delete the calendar name from the cookies
    cookieStore.delete("calendarName");

    // redirect to the calendar dashboard with user id
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/application/${selectedUser?._id}/calendars`
    );
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({
        message: error.message,
      }),
      { status: 500 }
    );
  }
}
