"use client";
import ApiError from "@/app/components/api-error";
import Button from "@/app/components/button";
import MyCalendar from "@/app/components/calendar";
import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import { useUserContext } from "@/context/userContext";
import { fetchData, postData } from "@/utils/fetch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ICalendar } from "../../calendars/interface";
import { useCalendarContext } from "@/context/calendarContext";
import Dropdown from "@/app/components/dropdown";
import { isPaidUser } from "@/utils/checkProtectedRoutes";
import { getMaxTime } from "@/utils/time";
import "./styles.css";
import moment from "moment";
import Input from "@/app/components/input";

export default function FillCalendar() {
  const router = useRouter();
  const { calendars } = useCalendarContext();
  const { user } = useUserContext();
  const [computedEvents, setComputedEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState<ICalendar>(
    calendars[0]
  );
  const [fetchEvents, setFetchEvents] = useState(false);
  const [isFetchingComputedEventsLoading, setIsFetchingComputedEventsLoading] =
    useState(false);
  const [isFillingCalendarLoading, setIsFillingCalendarLoading] =
    useState(false);
  const [error, setError] = useState({
    startDateError: "",
    endDateError: "",
    apiError: "",
  });
  const [state, setState] = useState({
    fillPercentage: 20,
    startDate: moment(new Date()).format("yyyy-MM-DD"),
    endDate: moment(new Date()).add(14, "days").format("yyyy-MM-DD"),
  });

  const { fillPercentage, startDate, endDate } = state;

  async function fetchFreeComputedEvents() {
    setFetchEvents(true);
    setIsFetchingComputedEventsLoading(true);
    try {
      // compute maxTime based on user plan
      const maxTime = getMaxTime(user);
      const response = await fetchData(
        `/api/compute-events?calendarId=${selectedCalendar?._id}&userId=${user?._id}&maxTime=${maxTime}`
      );
      const { data } = response;
      setUserEvents(data?.events);
      setComputedEvents(data?.computedEvents);
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
    } finally {
      setIsFetchingComputedEventsLoading(false);
    }
  }

  async function fetchPaidComputedEvents() {
    if (!startDate) {
      setError((error) => ({
        ...error,
        startDateError: "Please select a start date",
      }));
      return;
    }
    if (!endDate) {
      setError((error) => ({
        ...error,
        endDateError: "Please select an end date",
      }));
      return;
    }
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      setError((error) => ({
        ...error,
        endDateError: "End date should be greater than start date",
      }));
      return;
    }
    setFetchEvents(true);
    setIsFetchingComputedEventsLoading(true);
    try {
      // compute maxTime based on user plan
      const maxTime = getMaxTime(user);
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      const response = await fetchData(
        `/api/compute-events?calendarId=${selectedCalendar?._id}&userId=${user?._id}&maxTime=${maxTime}&percentage=${fillPercentage}&startDate=${start}&endDate=${end}`
      );
      const { data } = response;
      setUserEvents(data?.events);
      setComputedEvents(data?.computedEvents);
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
    } finally {
      setIsFetchingComputedEventsLoading(false);
    }
  }

  async function onFillCalendar() {
    try {
      setIsFillingCalendarLoading(true);
      const response = await await postData(`/api/fill-calendar`, {
        userId: user?._id,
        events: computedEvents,
        calendarId: selectedCalendar._id,
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

  function renderButtonState() {
    if (isFetchingComputedEventsLoading) {
      return (
        <div className="text-heading text-lg mt-4">
          Creating random events...
        </div>
      );
    }
    if (fetchEvents) {
      return (
        <div className="flex flex-col gap-4 mt-4">
          <div className="text-subHeading text-lg">
            Click confirm if {"you're"} happy with this random fill. Or click
            start over to get new events.
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
              buttonText="Confirm Fill"
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
              onClick={() => onFillCalendar()}
            />
          </div>
          <div className="py-2">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#854545] rounded-[8px]" />
                <p className="text-sm leading-md text-heading">AwayMe Events</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent rounded-[8px]" />
                <p className="text-sm leading-md text-heading">
                  {selectedCalendar?.name} Events
                </p>
              </div>
            </div>
          </div>
          <div className="w-[80%] bg-white border border-stroke/20 rounded-[12px] p-5 shadow-card">
            <MyCalendar
              events={[
                ...userEvents?.map((event: any) => ({
                  ...event,
                  title: event.summary,
                  start: new Date(event?.start?.dateTime),
                  end: new Date(event?.end?.dateTime),
                })),
                ...computedEvents?.map((event: any) => ({
                  ...event,
                  title: event.summary,
                  start: new Date(event?.start?.dateTime),
                  end: new Date(event?.end?.dateTime),
                  data: {
                    type: "multi-calendar",
                  },
                })),
              ]}
            />
          </div>
        </div>
      );
    }
    if (isPaidUser(user)) {
      return (
        <div className="flex flex-col gap-8 mt-4">
          <div className="flex items-center gap-8">
            <div className="w-[250px]">
              <label
                className="block text-sm text-heading mb-2 font-inter"
                htmlFor="fillPercentage"
              >
                Fill Percentage
              </label>
              <input
                disabled={fetchEvents}
                type="range"
                min="1"
                max="100"
                value={fillPercentage}
                className="slider"
                id="fillPercentage"
                name="fillPercentage"
                onChange={(event) =>
                  setState((value) => ({
                    ...value,
                    fillPercentage: Number(event.target.value),
                  }))
                }
              />
              <p className="mt-2 text-base text-heading">{fillPercentage}%</p>
            </div>

            <div className="w-[250px]">
              <Input
                type="date"
                hasLabel
                value={startDate}
                min={moment().format("YYYY-MM-DD")}
                max={moment(getMaxTime(user)).format("YYYY-MM-DD")}
                label="Start Date"
                placeholder="Select your start date"
                onChange={(event) => {
                  setState((value) => ({
                    ...value,
                    startDate: event.target.value,
                  }));
                  setError((error) => ({
                    ...error,
                    startDateError: "",
                  }));
                }}
                hasError={error.startDateError !== ""}
                error={error.startDateError}
                disabled={fetchEvents}
              />
            </div>
            <div className="w-[250px]">
              <Input
                type="date"
                hasLabel
                value={endDate}
                label="End Date"
                min={moment(startDate).format("YYYY-MM-DD")}
                max={moment(getMaxTime(user)).format("YYYY-MM-DD")}
                placeholder="Select your end date"
                onChange={(event) => {
                  setState((value) => ({
                    ...value,
                    endDate: event.target.value,
                  }));
                  setError((error) => ({
                    ...error,
                    endDateError: "",
                  }));
                }}
                hasError={error.endDateError !== ""}
                error={error.endDateError}
                disabled={fetchEvents}
              />
            </div>
          </div>
          <div className="flex items-center gap-8 mt-4">
            <Button
              isDisabled={isFetchingComputedEventsLoading}
              buttonText="Cancel"
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-subHeading text-white"
              onClick={() => router.push(`/application/${user?._id}/dashboard`)}
            />
            <Button
              isDisabled={isFetchingComputedEventsLoading}
              isLoading={isFetchingComputedEventsLoading}
              buttonText="Create Events"
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
              onClick={() => fetchPaidComputedEvents()}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-8 mt-4">
        <Button
          isDisabled={isFetchingComputedEventsLoading}
          buttonText="Cancel"
          buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-subHeading text-white"
          onClick={() => router.push(`/application/${user?._id}/dashboard`)}
        />
        <Button
          isDisabled={isFetchingComputedEventsLoading}
          isLoading={isFetchingComputedEventsLoading}
          buttonText="Create Events"
          buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
          onClick={() => fetchFreeComputedEvents()}
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
            >
              Dashboard
            </Link>
          </div>
          <div className="flex flex-col pb-12">
            <h3 className="font-archivo text-2xl leading-[48px] text-heading font-semibold">
              Randomly Fill a Calendar
            </h3>
            {isPaidUser(user) ? (
              <p className="text-base leading-[24px] font-medium text-subHeading max-w-[60%]">
                Select a calendar, a fill percentage, and a date range. Click{" "}
                <span className="font-bold text-heading">Create Events</span> to
                fill. {"You'll"} be asked to confirm in the next step.
              </p>
            ) : (
              <p className="text-base leading-[24px] font-medium text-subHeading max-w-[60%]">
                Select a calendar to fill. Because {"you're"} on the free
                version, {"you're"} only able to fill 20%. You will be able to
                fill it again in two weeks{" "}
                <span>
                  <Link
                    href={`/application/${user?._id}/billing`}
                    className="text-accent underline font-bold text-md leading-md"
                  >
                    Upgrade Now
                  </Link>
                </span>{" "}
              </p>
            )}
            <div className="flex items-center gap-8 mt-4">
              <Dropdown
                isDisabled={fetchEvents}
                id="calendar"
                label="Choose a Calendar"
                onClick={(value) => {
                  const calendar: any = calendars.find(
                    (calendar) => calendar?._id === value?.id
                  );
                  setSelectedCalendar(calendar);
                }}
                options={calendars?.map(({ _id = "", name = "" }) => ({
                  id: _id,
                  name,
                }))}
                selectedOption={{
                  id: selectedCalendar?._id || "",
                  name: selectedCalendar?.name || "",
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
