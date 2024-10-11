"use client";
import { useEffect, useState } from "react";
import ApiError from "@/app/components/api-error";
import Button from "@/app/components/button";
import Dropdown from "@/app/components/dropdown";
import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import { useCalendarContext } from "@/context/calendarContext";
import { useUserContext } from "@/context/userContext";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import { useRouter } from "next/navigation";
import { fetchData } from "@/utils/fetch";
import MyCalendar from "@/app/components/calendar";
import { isPaidUser } from "@/utils/checkProtectedRoutes";
import { getFourMonthsLaterDate, getTwoWeeksLaterDate } from "@/utils/time";

export default function Dashboard() {
  const { user } = useUserContext();
  const { calendars } = useCalendarContext();
  const [selectedCalendar, setSelectedCalendar] = useState(calendars[0]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState({
    calendarNameError: "",
    apiError: "",
  });
  const router = useRouter();

  useEffect(() => {
    async function fetchAllEvents() {
      setLoading(true);
      try {
        // compute maxTime based on user plan
        const maxTime = isPaidUser(user)
          ? getFourMonthsLaterDate()
          : getTwoWeeksLaterDate();
        const response = await fetchData(
          `/api/calendar-events?calendarId=${selectedCalendar?._id}&userId=${user?._id}&maxTime=${maxTime}`
        );
        const { data } = response;
        const events = data?.map((eventData: any) => ({
          title: eventData?.summary,
          start: new Date(eventData?.start?.dateTime),
          end: new Date(eventData?.end?.dateTime),
        }));
        setEvents(events);
      } catch (err: any) {
        setError((error) => ({
          ...error,
          apiError: err.message,
        }));
      } finally {
        setLoading(false);
      }
    }

    if (selectedCalendar && user) {
      fetchAllEvents();
    }
  }, [selectedCalendar, user]);

  const EMPTY_STATE = (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4">
          <img
            src="/empty-state.svg"
            alt="Empty State Illustration for empty results"
            className="w-[250px]"
          />
        </div>
        <p className="font-archivo text-2xl leading-[36px] text-heading font-semibold text-center">
          No Calendar Found
        </p>
        <p className="text-base leading-[24px] text-subHeading text-center max-w-[80%]">
          Cick the button below to connect and import a calendar to fill.
        </p>
        <div className="mt-4 flex justify-center">
          <Button
            buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
            buttonText="Import Calendar"
            onClick={() =>
              router.push(`/application/${user?._id}/calendars/import-calendar`)
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-start">
      <Sidebar />
      <div className="flex-1 h-screen overflow-auto">
        <TopBar />
        <div className="px-8 py-4">
          {calendars.length <= 0 ? (
            EMPTY_STATE
          ) : (
            <>
              <div className="flex flex-col pb-8">
                <h3 className="font-archivo text-2xl leading-[48px] text-heading font-semibold">
                  Dashboard
                </h3>
                <p className="text-base leading-[24px] font-medium text-subHeading ">
                  A detailed view of your calendar events. You can switch
                  between your calendars here
                </p>
                <div className="flex items-center gap-8 mt-6">
                  <Button
                    buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
                    buttonText="Fill Calendar"
                    onClick={() =>
                      router.push(
                        `/application/${user?._id}/dashboard/fill-calendar`
                      )
                    }
                  />
                  {isPaidUser(user) && (
                    <Button
                      isDisabled={calendars.length < 2}
                      buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
                      buttonText="Merge Calendar"
                      onClick={() =>
                        router.push(
                          `/application/${user?._id}/dashboard/merge-calendar`
                        )
                      }
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col pb-8">
                <h3 className="font-archivo text-2xl leading-[48px] text-heading font-semibold">
                  Calendar View
                </h3>
                <p className="text-base leading-[24px] font-medium text-subHeading ">
                  Select the calendar to view the events
                </p>
                <div className="flex mt-2">
                  <Dropdown
                    id="selectCalendar"
                    label="Select Calendar"
                    isDisabled={loading}
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
                    hasError={error.calendarNameError !== ""}
                    error={error.calendarNameError}
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
                <div className="mt-4">
                  {loading ? (
                    <p className="text-lg leading-[36px] text-heading">
                      Fetching calendar events for {selectedCalendar?.name}
                    </p>
                  ) : (
                    <div className="w-[80%] bg-white border border-stroke/20 rounded-[12px] p-5 shadow-card">
                      <MyCalendar events={events} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
