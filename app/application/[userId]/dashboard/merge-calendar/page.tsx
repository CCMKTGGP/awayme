"use client";
import Dropdown from "@/app/components/dropdown";
import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import { useCalendarContext } from "@/context/calendarContext";
import { useUserContext } from "@/context/userContext";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ICalendar } from "../../calendars/interface";
import { fetchData, postData } from "@/utils/fetch";
import ApiError from "@/app/components/api-error";
import Button from "@/app/components/button";
import { useRouter } from "next/navigation";
import MyCalendar from "@/app/components/calendar";
import { isPaidUser } from "@/utils/checkProtectedRoutes";
import { getMaxTime } from "@/utils/time";

export default function MergeCalendar() {
  const router = useRouter();
  const { user } = useUserContext();
  const { calendars } = useCalendarContext();
  const [sourceCalendar, setSourceCalendar] = useState<ICalendar>(calendars[0]);
  const [destinationCalendar, setDestinationCalendar] = useState<ICalendar>(
    calendars[1]
  );
  const [fetchEvents, setFetchEvents] = useState(false);
  const [sourceEvents, setSourceEvents] = useState<any>([]);
  const [destinationEvents, setDestinationEvents] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFillingCalendarLoading, setIsFillingCalendarLoading] =
    useState(false);
  const [error, setError] = useState({
    apiError: "",
  });

  // compute maxTime based on user plan
  const maxTime = getMaxTime(user);

  async function fetchSourceEvents() {
    setIsLoading(true);
    try {
      const response = await fetchData(
        `/api/calendar-events?calendarId=${sourceCalendar?._id}&userId=${user?._id}&maxTime=${maxTime}`
      );
      const { data } = response;
      setSourceEvents(data);
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
    }
  }

  async function fetchDestinationEvents() {
    try {
      const response = await fetchData(
        `/api/calendar-events?calendarId=${destinationCalendar?._id}&userId=${user?._id}&maxTime=${maxTime}`
      );
      const { data } = response;
      setDestinationEvents(data);
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
    } finally {
      setIsLoading(false);
    }
  }

  async function onFillCalendar() {
    try {
      setIsFillingCalendarLoading(true);
      const response = await await postData(`/api/fill-calendar`, {
        userId: user?._id,
        events: sourceEvents,
        calendarId: destinationCalendar._id,
        isPaidUser: isPaidUser(user),
      });
      const { data } = response;
      const { message } = data;
      console.log(message);
      router.push(`/application/${user?._id}/dashboard`);
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
    } finally {
      setIsFillingCalendarLoading(false);
    }
  }

  useEffect(() => {
    if (fetchEvents) {
      fetchSourceEvents();
      fetchDestinationEvents();
    }
  }, [fetchEvents]);

  function renderButtonState() {
    if (isLoading) {
      return (
        <div className="text-heading text-lg mt-4">
          Fetching source calendar events...
        </div>
      );
    }
    if (fetchEvents) {
      return (
        <div className="flex flex-col gap-8 mt-4">
          <div className="flex flex-col gap-2">
            <p className="text-base font-medium text-subHeading">
              Please confirm the events you want to transfer from the source
              calendar to the destination calendar.
            </p>
            <p className="text-base leading-[24px] font-medium text-subHeading">
              AwayMe will copy events from{" "}
              <span className="font-bold text-heading">
                {sourceCalendar?.name}
              </span>{" "}
              {" to "}
              <span className="font-bold text-heading">
                {destinationCalendar?.name}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-8">
            <Button
              isDisabled={isFillingCalendarLoading}
              buttonText="Start Over"
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-subHeading text-white"
              onClick={() => setFetchEvents(false)}
            />
            <Button
              isDisabled={isFillingCalendarLoading}
              isLoading={isFillingCalendarLoading}
              buttonText="Confirm Sync"
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
              onClick={() => onFillCalendar()}
            />
          </div>
          <div className="py-2">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#854545] rounded-[8px]" />
                <p className="text-sm leading-md text-heading">
                  {sourceCalendar?.name} Events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent rounded-[8px]" />
                <p className="text-sm leading-md text-heading">
                  {destinationCalendar?.name} Events
                </p>
              </div>
            </div>
          </div>
          <div className="w-[80%] bg-white border border-stroke/20 rounded-[12px] p-5 shadow-card">
            <MyCalendar
              events={[
                ...sourceEvents?.map((event: any) => ({
                  ...event,
                  title: event.summary,
                  start: new Date(event?.start?.dateTime),
                  end: new Date(event?.end?.dateTime),
                  data: {
                    type: "multi-calendar",
                  },
                })),
                ...destinationEvents?.map((event: any) => ({
                  ...event,
                  title: event.summary,
                  start: new Date(event?.start?.dateTime),
                  end: new Date(event?.end?.dateTime),
                })),
              ]}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-8 mt-4">
        <Button
          buttonText="Cancel"
          buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-subHeading text-white"
          onClick={() => router.push(`/application/${user?._id}/dashboard`)}
        />
        <Button
          buttonText="Fetch Events"
          buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
          onClick={() => setFetchEvents(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start">
      <Sidebar />
      <div className="flex-1 h-screen overflow-auto">
        <TopBar />
        <div className="px-8 py-4">
          <div className="my-2">
            <Link
              href={`/application/${user?._id}/dashboard`}
              className="text-heading underline font-medium text-md leading-md"
              onClick={(event) => {
                if (isFillingCalendarLoading) {
                  event.preventDefault();
                }
              }}
            >
              Dashboard
            </Link>
          </div>
          <div className="flex flex-col pb-12">
            <h3 className="font-archivo text-2xl leading-[48px] text-heading font-semibold">
              Sync Calendar
            </h3>
            <p className="text-base leading-[24px] font-medium text-subHeading ">
              Select source and destination calendars. Events from your source
              calendar will be merged into the destination calendar. <br />{" "}
              {"You'll"} be asked to confirm in the next step.
            </p>
            <div className="flex items-center gap-8 mt-4">
              <Dropdown
                isDisabled={fetchEvents}
                id="sourceCalendar"
                label="Select Source Calendar"
                onClick={(value) => {
                  const calendar: any = calendars.find(
                    (calendar) => calendar?._id === value?.id
                  );
                  setSourceCalendar(calendar);
                  const filteredCalendars = calendars?.filter(
                    (calendar) => calendar._id !== value?.id
                  );
                  setDestinationCalendar(filteredCalendars[0]);
                }}
                options={calendars?.map(({ _id = "", name = "" }) => ({
                  id: _id,
                  name,
                }))}
                selectedOption={{
                  id: sourceCalendar?._id || "",
                  name: sourceCalendar?.name || "",
                }}
              />
              <img src="/arrow-right.svg" alt="Arrow Right svg" />
              <Dropdown
                isDisabled={fetchEvents}
                id="destinationCalendar"
                label="Select Destination Calendar"
                onClick={(value) => {
                  const calendar: any = calendars.find(
                    (calendar) => calendar?._id === value?.id
                  );
                  setDestinationCalendar(calendar);
                }}
                options={calendars
                  ?.filter((calendar) => calendar._id !== sourceCalendar?._id)
                  ?.map(({ _id = "", name = "" }) => ({
                    id: _id,
                    name,
                  }))}
                selectedOption={{
                  id: destinationCalendar?._id || "",
                  name: destinationCalendar?.name || "",
                }}
              />
            </div>
            {error.apiError && (
              <ApiError
                message={error.apiError}
                setMessage={(value) =>
                  setError((error) => ({
                    ...error,
                    apiError: value,
                  }))
                }
              />
            )}
            {renderButtonState()}
          </div>
        </div>
      </div>
    </div>
  );
}
