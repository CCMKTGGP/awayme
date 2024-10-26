import { CalendarTypes } from "@/constants/calendarTypes";
import connect from "@/lib/db";
import Calendar from "@/lib/models/calendar";
import User from "@/lib/models/user";
import { decrypt, encrypt } from "@/utils/crypto";
import moment from "moment";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { msalConfig, storeOutlookEvents } from "@/lib/microsoftClient";
import { storeGoogleEvents } from "@/lib/googleClient";

const cca = new ConfidentialClientApplication(msalConfig);

export async function POST(request: Request) {
  const { events, userId, calendarId, isPaidUser } = await request.json();

  // check if the userId exist and is valid
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid or missing userId!" }),
      { status: 400 }
    );
  }

  // establish the connection with database
  await connect();

  // check if the user exists in the database
  const user = await User.findById(userId);
  if (!user) {
    return new NextResponse(
      JSON.stringify({ message: "User does not exist!" }),
      { status: 400 }
    );
  }

  // check if the calendarId is valid
  if (!calendarId || !Types.ObjectId.isValid(calendarId)) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid or missing calendarId!" }),
      { status: 400 }
    );
  }

  // check if the calendar exists in the database
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) {
    return new NextResponse(
      JSON.stringify({ message: "Calendar does not exist!" }),
      { status: 400 }
    );
  }

  // check if the calendar belongs to this user or not
  if (String(calendar.user) !== String(userId)) {
    return new NextResponse(
      JSON.stringify({ message: "Calendar does not belong to this user!" }),
      { status: 400 }
    );
  }

  // check if the current date is greater than the nextCalendarUpdateDate date
  // extract the two weeks later date
  const today = new Date();
  const nextCalendarUpdateDate = new Date(user?.nextCalendarUpdateDate);

  if (today.getTime() < nextCalendarUpdateDate.getTime()) {
    return new NextResponse(
      JSON.stringify({
        message: `You have already filled the calendar. your next calendar update date is ${moment(
          nextCalendarUpdateDate
        ).format("YYYY-MM-DD")}!`,
      }),
      { status: 400 }
    );
  }

  let result;

  //   store events based on the provider
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

    // extract the access token
    const { access_token } = await response.json();

    // pass it to the function
    result = await storeGoogleEvents({
      accessToken: access_token,
      refreshToken,
      events,
    });
  } else if (
    calendar?.provider.toLowerCase() === CalendarTypes.OUTLOOK.toLowerCase()
  ) {
    // fetch the encrpted refresh token
    const { refresh_token } = calendar;

    // decrypt the refresh token
    const refreshToken = decrypt(refresh_token);
    // fetch latest access token.
    const response: any = await cca.acquireTokenByRefreshToken({
      refreshToken: refreshToken,
      scopes: ["User.Read", "Calendars.Read"],
    });

    // extract the access token from result
    const { accessToken } = response;

    // pass it to the function
    result = await storeOutlookEvents({
      accessToken,
      refreshToken,
      events: events?.map((event: any) => {
        return {
          start: event.start,
          end: event.end,
          subject: event.summary,
        };
      }),
    });
  }

  if (result?.success) {
    if (!isPaidUser) {
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);
      // update the user account with nextUpdateDate timestamp
      // this is needed because we will not allow to update if the current date
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          nextCalendarUpdateDate: twoWeeksLater,
        },
        {
          new: true,
        }
      );

      // check if the process successed
      if (!updatedUser) {
        return new NextResponse(
          JSON.stringify({ message: "User next calendar date not updated!" }),
          { status: 400 }
        );
      }
    }

    return new NextResponse(
      JSON.stringify({
        message: "Events stored successfully!",
        data: {
          events,
        },
      }),
      { status: 201 }
    );
  } else {
    return new NextResponse(
      JSON.stringify({
        message: "Error storing events.",
        errors: result?.errors?.map(({ error, event }) => ({
          message: error.message,
          event,
        })),
      }),
      { status: 500 }
    );
  }
}
