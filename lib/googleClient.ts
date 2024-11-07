import { convertUtcToLocal } from "@/utils/time";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

interface IEventTypes {
  accessToken: string;
  refreshToken: string;
  maxTime: string;
  timeZone: string;
}

interface IStoreEventTypes {
  accessToken: string;
  refreshToken: string;
  events: any;
}

function googleClient({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const oauth2Client = new OAuth2Client({
    clientId,
    clientSecret,
  });

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Use the provider token to authenticate with the Google Calendar API
  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  return calendar;
}

export async function getGoogleEvents({
  accessToken,
  refreshToken,
  maxTime,
  timeZone,
}: IEventTypes) {
  const calendar = googleClient({
    accessToken,
    refreshToken,
  });

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    timeMax: maxTime,
    singleEvents: true,
    orderBy: "startTime",
  });

  // extract the events to format
  const response = res.data.items;

  // format the events for the calendar component
  const events = response?.map((eventData: any) => {
    // convert the timezone to the user's local time
    const start = {
      dateTime: convertUtcToLocal(eventData?.start?.dateTime, timeZone),
      timeZone: timeZone,
    };
    const end = {
      dateTime: convertUtcToLocal(eventData?.end?.dateTime, timeZone),
      timeZone: timeZone,
    };
    return {
      summary: eventData?.summary,
      start,
      end,
    };
  });

  // return the events
  return events;
}

// Utility function to delay for a specified time (debounce)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function storeGoogleEvents({
  events,
  accessToken,
  refreshToken,
}: IStoreEventTypes) {
  const calendar = googleClient({ accessToken, refreshToken });

  // Sequentially process events with optional debounce delay
  const errors = [];
  for (let i = 0; i < events.length; i++) {
    try {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: events[i],
      });
    } catch (error) {
      errors.push({ error, event: events[i] }); // Capture the error with the event details
    }

    // Optional: delay between requests to avoid throttling issues
    await delay(200);
  }

  // Return the result indicating if all events were stored successfully
  return { success: errors.length === 0, errors };
}
