"use client";
import CalendarNameModel from "@/app/components/calendar-name-model";
import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import { CalendarTypes } from "@/constants/calendarTypes";
import { useUserContext } from "@/context/userContext";
import { fetchData } from "@/utils/fetch";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useRef, useState } from "react";

export default function ImportCalendar() {
  const { user } = useUserContext();
  const linkRef = useRef<any>();
  const [calendar, setCalendar] = useState({
    toggle: false,
    type: "",
  });

  async function handleMicrosoftLogin() {
    try {
      const response = await fetchData("/api/login-with-microsoft");
      const { data } = response;
      linkRef.current.href = data;
      linkRef.current.click();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex items-start">
      <Sidebar />
      <div className="flex-1 h-screen overflow-auto">
        <TopBar />
        <div className="px-8 py-4">
          <div className="my-2">
            <Link
              href={`/application/${user?._id}/calendars`}
              className="text-heading underline font-medium text-md leading-md"
            >
              Your Calendars
            </Link>
          </div>
          <div className="flex flex-col pb-12">
            <h3 className="font-archivo text-2xl leading-[48px] text-heading font-bold">
              Import a Calendar
            </h3>
            <p className="text-base leading-[24px] font-medium text-subHeading ">
            Select the provider. AwayMe currently supports only Google and Microsoft calendars.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <button
                type="button"
                className="w-[200px] h-[200px] bg-white border border-stroke/20 rounded-[12px] shadow-card flex flex-col items-center justify-center gap-6"
                onClick={() =>
                  setCalendar((calendar) => ({
                    ...calendar,
                    toggle: true,
                    type: CalendarTypes.GOOGLE,
                  }))
                }
              >
                <img
                  src="/google-icon.png"
                  alt="Google Icon"
                  className="w-[100px]"
                />
                <p className="text-md leading-md text-heading">Google</p>
              </button>
              <button
                type="button"
                className="w-[200px] h-[200px] bg-white border border-stroke/20 rounded-[12px] shadow-card flex flex-col items-center justify-center gap-6"
                onClick={() =>
                  setCalendar((calendar) => ({
                    ...calendar,
                    toggle: true,
                    type: CalendarTypes.OUTLOOK,
                  }))
                }
              >
                <img
                  src="/outlook-icon.png"
                  alt="Outlook Icon"
                  className="w-[100px]"
                />
                <p className="text-md leading-md text-heading">Microsoft</p>
              </button>
            </div>
          </div>
          {/* {error.apiError && <ApiError errorMessage={error.apiError} />} */}
        </div>
      </div>
      {calendar?.toggle && (
        <CalendarNameModel
          accountType={calendar.type}
          onCancel={() => {
            setCalendar((calendar) => ({
              ...calendar,
              type: "",
              toggle: false,
            }));
          }}
          onConfirm={(accountType: string) => {
            setCalendar((calendar) => ({
              ...calendar,
              type: "",
              toggle: false,
            }));
            if (
              accountType.toLowerCase() === CalendarTypes.GOOGLE.toLowerCase()
            ) {
              signIn("google", {
                redirect: true,
                callbackUrl: `/application/${user?._id}/calendars`,
              });
              return;
            }
            if (
              accountType.toLowerCase() === CalendarTypes.OUTLOOK.toLowerCase()
            ) {
              return handleMicrosoftLogin();
            }
          }}
        />
      )}
      <a ref={linkRef} className="hidden"></a>
    </div>
  );
}
