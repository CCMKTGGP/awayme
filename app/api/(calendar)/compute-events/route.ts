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
      let startOfWorkingHours;
      const endOfWorkingHours = moment
        .tz(d.format("YYYY-MM-DD"), timeZone)
        .set({ hour: 18, minute: 0, second: 0 });

      // If processing today's date, start from current time, else start from 8 AM
      if (d.isSame(now, "day")) {
        startOfWorkingHours = moment.max(
          now,
          moment
            .tz(d.format("YYYY-MM-DD"), timeZone)
            .set({ hour: 8, minute: 0, second: 0 })
        );
      } else {
        startOfWorkingHours = moment.tz(d.format("YYYY-MM-DD"), timeZone).set({
          hour: 8,
          minute: 0,
          second: 0,
        });
      }

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
  // Now, let's divide the found free slots into chunks of 30, 60, 90, and 120 minutes
  const updatedFreeSlots = splitIntoTimeChunks(freeSlots, timeZone);
  return updatedFreeSlots;
}

// Helper function to split free slots into fixed duration chunks (30, 60, 90, 120 minutes)
function splitIntoTimeChunks(freeSlots: any[], timeZone: string) {
  const durations = [120, 90, 60, 30]; // Possible slot durations in minutes
  const updatedFreeSlots = [];

  for (const slot of freeSlots) {
    let currentStart = moment.tz(slot.start, timeZone);
    const slotEnd = moment.tz(slot.end, timeZone);

    while (currentStart.isBefore(slotEnd)) {
      const availableMinutes = slotEnd.diff(currentStart, "minutes");

      // Find the largest possible duration that fits into the available time
      const chosenDuration = durations.find(
        (duration) => duration <= availableMinutes
      );

      if (!chosenDuration) break; // No valid duration found, exit loop

      const newSlotEnd = currentStart.clone().add(chosenDuration, "minutes");

      // Add the chunk to the updated slots
      updatedFreeSlots.push({
        start: currentStart.toDate(),
        end: newSlotEnd.toDate(),
      });

      // Move the current start time to the end of the newly created chunk
      currentStart = newSlotEnd;
    }
  }

  return updatedFreeSlots;
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
  const shuffledSlots = freeSlots
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, numberOfEvents);

  for (const slot of shuffledSlots) {
    const slotStart = moment.tz(slot.start, timeZone);
    const slotEnd = moment.tz(slot.end, timeZone);

    const availableMinutes = slotEnd.diff(slotStart, "minutes");

    // Make sure the event duration fits within the free slot
    const actualMaxDuration = Math.min(maxDuration, availableMinutes);

    if (actualMaxDuration < minDuration) continue; // Skip this slot if it can't fit the minimum event

    const randomDuration =
      Math.floor(Math.random() * (actualMaxDuration - minDuration + 1)) +
      minDuration;

    const randomStartOffset = Math.floor(
      Math.random() * (availableMinutes - randomDuration)
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
      // fetch the encrpted refresh token
      const { refresh_token } = calendar;

      // decrypt the access token and refresh token
      const refreshToken = decrypt(refresh_token);

      // fetch latest access token.
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}`,
      });

      // extract the access token from response
      const { access_token } = await response.json();

      // pass it to the function
      events = await getGoogleEvents({
        accessToken: access_token,
        refreshToken,
        maxTime,
        timeZone,
      });
    } else if (
      calendar?.provider.toLowerCase() === CalendarTypes.OUTLOOK.toLowerCase()
    ) {
      // fetch the encrpted refresh token
      const { refresh_token } = calendar;

      // decrypt the refresh token
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
    const minDuration = 30;
    const maxDuration = 120;

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
