import { NextResponse } from "next/server";
import { Types } from "mongoose";
import Calendar from "@/lib/models/calendar";
import User from "@/lib/models/user";
import { decrypt, encrypt } from "@/utils/crypto";
import { CalendarTypes } from "@/constants/calendarTypes";
import { getMicrosoftEvents, msalConfig } from "@/lib/microsoftClient";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { getGoogleEvents } from "@/lib/googleClient";

const cca = new ConfidentialClientApplication(msalConfig);

// get exents for a calendar based on given id
export async function GET(request: Request) {
  // extract the store id from the search params
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId") as string;
  const userId = searchParams.get("userId") as string;
  const maxTime = searchParams.get("maxTime") as string;

  if (!maxTime) {
    return new NextResponse(JSON.stringify({ message: "Missing maxTime!" }), {
      status: 400,
    });
  }

  // check if the calendarId exist and is valid
  if (!calendarId || !Types.ObjectId.isValid(calendarId)) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid or missing calendarId!" }),
      { status: 400 }
    );
  }

  // check if the calendarId exist and is valid
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid or missing calendarId!" }),
      { status: 400 }
    );
  }

  // check if the calendar exists
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) {
    return new NextResponse(
      JSON.stringify({ message: "Calendar does not exist!" }),
      { status: 400 }
    );
  }

  // check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ message: "User does not exist!" }),
      { status: 400 }
    );
  }

  // check if the user has the calendar
  if (String(calendar.user) !== userId) {
    return new NextResponse(
      JSON.stringify({ message: "User does not belong to the calendar!" }),
      { status: 400 }
    );
  }

  // fetch the calendar based on the both id
  let events;
  //   Fetch events based on the provider
  if (calendar?.provider.toLowerCase() === CalendarTypes.GOOGLE.toLowerCase()) {
    // fetch the encrpted refresh token
    const { refresh_token } = calendar;

    // decrypt the refresh token
    const refreshToken = decrypt(refresh_token);

    // fetch latest access token.
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}`,
    });

    // extract the access token from the response
    const { access_token } = await response.json();

    // pass it to the function
    events = await getGoogleEvents({
      accessToken: access_token,
      refreshToken,
      maxTime,
      timeZone: user?.timeZone,
    });
  } else if (
    calendar?.provider.toLowerCase() === CalendarTypes.OUTLOOK.toLowerCase()
  ) {
    // fetch the encrpted refresh token
    const { refresh_token } = calendar;

    // decrypt the access
    const refreshToken = decrypt(refresh_token);

    // fetch latest access token.
    const result: any = await cca.acquireTokenByRefreshToken({
      refreshToken: refreshToken,
      scopes: ["User.Read", "Calendars.ReadWrite"],
    });

    // extract the access token from result
    const { accessToken } = result;

    // pass it to the function
    events = await getMicrosoftEvents({
      accessToken,
      refreshToken,
      maxTime,
      timeZone: user?.timeZone,
    });
  }

  return new NextResponse(
    JSON.stringify(
      {
        message: "Events fetched successfully!",
        data: events,
      },
      null,
      4
    ),
    {
      status: 200,
    }
  );
}
