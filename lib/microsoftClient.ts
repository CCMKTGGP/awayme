import { convertUtcToLocal } from "@/utils/time";
import axios from "axios";

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

export const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/common/`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
  },
};

export async function getMicrosoftEvents({
  accessToken,
  refreshToken,
  maxTime,
  timeZone,
}: IEventTypes) {
  const currentTime = new Date().toISOString();
  const calendarResponse = await axios.get(
    `https://graph.microsoft.com/v1.0/me/events?$top=1000&$expand=instances&$filter=start/dateTime ge '${currentTime}' and end/dateTime le '${maxTime}'`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // extract the events to format
  const response = calendarResponse.data.value;

  // format the events for the calendar component
  const events = response?.map((eventData: any) => {
    const start = {
      dateTime: convertUtcToLocal(eventData?.start?.dateTime, timeZone),
      timeZone: timeZone,
    };
    const end = {
      dateTime: convertUtcToLocal(eventData?.end?.dateTime, timeZone),
      timeZone: timeZone,
    };
    return {
      summary: eventData?.subject,
      start,
      end,
    };
  });

  // return the events
  return events;
}

// Utility function to delay for a specified time (debounce)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function storeOutlookEvents({
  events,
  accessToken,
  refreshToken,
}: IStoreEventTypes) {
  const url = "https://graph.microsoft.com/v1.0/me/events";
  // Sequentially process events, debouncing with 200ms delay between each request
  const errors = [];

  for (let i = 0; i < events.length; i++) {
    try {
      await axios.post(url, events[i], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      errors.push({ error, event: events[i] }); // Capture the error with event details
    }

    // Optional: delay between requests to avoid throttling issues
    await delay(200);
  }

  // Return the result indicating if all events were stored successfully
  return { success: errors.length === 0, errors };
}
