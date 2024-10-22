import { CalendarTypes } from "@/constants/calendarTypes";
import moment from "moment-timezone";
import Calendar from "@/lib/models/calendar";
import User from "@/lib/models/user";
import { decrypt, encrypt } from "@/utils/crypto";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { getMicrosoftEvents, msalConfig } from "@/lib/microsoftClient";
import { getGoogleEvents } from "@/lib/googleClient";
import { EVENTS } from "@/constants/events";
import { PlanTypes } from "@/utils/planTypes";
import Plan from "@/lib/models/plan";

const cca = new ConfidentialClientApplication(msalConfig);

function findFreeSlots(events: any, endDate: Date, timeZone: string) {
  const busyTimes = events.map((event: any) => ({
    start: moment.tz(event.start.dateTime, timeZone),
    end: moment.tz(event.end.dateTime, timeZone),
  }));

  const freeSlots = [];
  const now = moment();

  for (
    let d = moment.tz(now, timeZone);
    d.isBefore(endDate);
    d.add(1, "days")
  ) {
    const day = d.day();

    // Only consider weekdays (Monday to Friday)
    if (day >= 1 && day <= 5) {
      // Set the working hours between 8 AM and 6 PM in the user's timezone
      const startOfWorkingHours = moment
        .tz(d.format("YYYY-MM-DD"), timeZone)
        .set({ hour: 8, minute: 0, second: 0 });
      const endOfWorkingHours = moment
        .tz(d.format("YYYY-MM-DD"), timeZone)
        .set({ hour: 18, minute: 0, second: 0 });

      let lastEndTime = startOfWorkingHours;

      // Iterate through busy times and find free slots between working hours
      for (const busy of busyTimes) {
        // If there is a free slot between the end of the last event and the start of the next event
        if (
          lastEndTime.isBefore(busy.start) &&
          busy.start.isSameOrAfter(lastEndTime) &&
          busy.start.isSameOrBefore(endOfWorkingHours)
        ) {
          freeSlots.push({
            start: lastEndTime.toDate(),
            end: busy.start.toDate(),
          });
        }
        if (
          lastEndTime.isBefore(busy.end) &&
          busy.start.isSameOrAfter(lastEndTime) &&
          busy.start.isSameOrBefore(endOfWorkingHours)
        ) {
          lastEndTime = busy.end;
        }
      }

      // If there is free time between the end of the last event and the end of the working hours
      if (lastEndTime.isBefore(endOfWorkingHours)) {
        freeSlots.push({
          start: lastEndTime.toDate(),
          end: endOfWorkingHours.toDate(),
        });
      }
    }
  }
  return freeSlots;
}

function createRandomEvents({
  freeSlots,
  minDuration,
  maxDuration,
  percentage,
  timeZone,
  isPaidUser,
}: {
  freeSlots: any;
  minDuration: number;
  maxDuration: number;
  percentage: number;
  timeZone: string;
  isPaidUser: boolean;
}) {
  const randomEvents: any = [];

  // Calculate the number of events based on the percentage of free slots
  const totalFreeSlots = freeSlots.length;
  const numberOfEvents = Math.floor(totalFreeSlots * (percentage / 100));

  if (numberOfEvents <= 0) {
    return randomEvents;
  }

  // Shuffle and select slots
  const shuffledSlots = freeSlots.slice(0, numberOfEvents);

  for (const slot of shuffledSlots) {
    const slotStart = moment.tz(slot.start, timeZone);
    const slotEnd = moment.tz(slot.end, timeZone);

    const maxPossibleDuration = Math.min(
      maxDuration,
      slotEnd.diff(slotStart, "minutes")
    );

    const randomDuration =
      Math.floor(Math.random() * (maxPossibleDuration - minDuration + 1)) +
      minDuration;

    const randomStartOffset = Math.floor(
      Math.random() * (slotEnd.diff(slotStart, "minutes") - randomDuration)
    );
    const eventStart = slotStart.clone().add(randomStartOffset, "minutes");
    const eventEnd = eventStart.clone().add(randomDuration, "minutes");

    // Get a random event title and description if the user is paid
    let summary = "Awayme Event";
    let description = "This event is created by Awayme";

    if (isPaidUser) {
      const randomEvent = getRandomEvent();
      summary = randomEvent.title;
      description = randomEvent.description;
    }

    randomEvents.push({
      summary,
      description,
      start: { dateTime: eventStart.toISOString(), timeZone },
      end: { dateTime: eventEnd.toISOString(), timeZone },
    });
  }

  return randomEvents;
}

function getRandomEvent() {
  const randomIndex = Math.floor(Math.random() * EVENTS.length);
  return EVENTS[randomIndex];
}

export async function GET(request: Request) {
  try {
    // extract the store id from the search params
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId");
    const userId = searchParams.get("userId");
    const maxTime = searchParams.get("maxTime") as string;
    const percentage = parseFloat(searchParams.get("percentage") || "25");
    const startDate = new Date(
      searchParams.get("startDate") || new Date().toISOString()
    );
    const endDate = new Date(
      searchParams.get("endDate") ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    );

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
        JSON.stringify({ message: "Invalid or missing userId!" }),
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

    // load all plans
    await Plan.find({});

    // check if the user exists
    const user = await User.findById(userId).populate({
      path: "plan",
      select: ["_id", "planId", "name", "numberOfCalendarsAllowed"],
    });
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
    const timeZone = user?.timeZone;
    //   Fetch events based on the provider
    if (
      calendar?.provider.toLowerCase() === CalendarTypes.GOOGLE.toLowerCase()
    ) {
      // fetch the encrpted access token and refresh token
      const { access_token, refresh_token } = calendar;

      // decrypt the access token and refresh token
      const accessToken = decrypt(access_token);
      const refreshToken = decrypt(refresh_token);
      // pass it to the function
      events = await getGoogleEvents({
        accessToken,
        refreshToken,
        maxTime,
        timeZone,
      });
    } else if (
      calendar?.provider.toLowerCase() === CalendarTypes.OUTLOOK.toLowerCase()
    ) {
      // fetch the encrpted access token and refresh token
      const { access_token, refresh_token, expires_at } = calendar;

      const current_date = new Date().getTime();
      const expires_at_time = new Date(expires_at).getTime();

      // decrypt the access token and refresh token
      let accessToken = decrypt(access_token);
      const refreshToken = decrypt(refresh_token);

      if (expires_at_time < current_date) {
        // fetch latest access token.
        const result: any = await cca.acquireTokenByRefreshToken({
          refreshToken: refreshToken,
          scopes: ["User.Read", "Calendars.Read"],
        });

        // extract the name, email, access token and expiry from result
        const { accessToken: access_token, expiresOn } = result;
        accessToken = access_token;
        const token = encrypt(access_token);

        calendar.access_token = token;
        calendar.expires_at = expiresOn;
        await calendar.save();
      }
      // pass it to the function
      events = await getMicrosoftEvents({
        accessToken,
        refreshToken,
        maxTime,
        timeZone,
      });
    }

    // fetch all the available free slots
    const freeSlots = findFreeSlots(events, endDate, timeZone);

    // Filter freeSlots based on the provided startDate and endDate
    const filteredSlots = freeSlots.filter(
      (slot) => slot.start >= startDate && slot.end <= endDate
    );

    // set min and max duration of the event
    const minDuration = 60;
    const maxDuration = 480;

    // compute the random events based on the free slots and desired percentage of events
    const computedEvents = createRandomEvents({
      freeSlots: filteredSlots,
      minDuration,
      maxDuration,
      percentage,
      timeZone,
      isPaidUser:
        user?.plan?.planId?.toLowerCase() !== PlanTypes.FREE.toLowerCase(),
    });

    return new NextResponse(
      JSON.stringify({
        message: "Events computed successfully!",
        data: {
          events,
          computedEvents,
        },
      }),
      {
        status: 200,
      }
    );
  } catch (err) {
    return new NextResponse("Error in populating event " + err, {
      status: 500,
    });
  }
}
