"use client";

import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import Input from "@/app/components/input";
import Button from "@/app/components/button";
import React, { useState, useEffect } from "react";
import { useUserContext } from "@/context/userContext";
import { putData } from "@/utils/fetch";
import { getAllTimezones } from "@/utils/time";
import Dropdown from "@/app/components/dropdown";
import ApiError from "@/app/components/api-error";

export default function Account() {
  const { user, setUser, toggleFetchUserDetails, setToggleFetchUserDetails } =
    useUserContext();
  const [timezones, setTimezones] = useState<any[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timeZone);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [error, setError] = useState({
    firstNameError: "",
    lastNameError: "",
    timeZoneError: "",
    apiError: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { tzNames } = getAllTimezones();
    setTimezones(tzNames?.map((tz) => ({ id: tz, name: tz })));
  }, []);

  const handleUpdate = async () => {
    setIsLoading(true);
    if (validateFields()) {
      try {
        const url = `/api/users/${user._id}`;
        const body = { firstName, lastName, timeZone: selectedTimezone };
        const updatedUser = await putData(url, body);
        setUser(updatedUser);
        setToggleFetchUserDetails(!toggleFetchUserDetails);
      } catch (error: any) {
        console.error("Failed to update user details:", error.message);
        setError((err: any) => ({
          ...err,
          apiError: err?.message,
        }));
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setError((error) => ({
      ...error,
      firstNameError: "",
      lastNameError: "",
      timeZoneError: "",
    }));
  };

  function validateFields() {
    let isValid = true;
    setError((error) => ({
      ...error,
      firstNameError: "",
      lastNameError: "",
      timeZoneError: "",
    }));
    if (!firstName) {
      setError((prev) => ({
        ...prev,
        firstNameError: "First name is required",
      }));
      isValid = false;
    }
    if (!lastName) {
      setError((prev) => ({ ...prev, lastNameError: "Last name is required" }));
      isValid = false;
    }
    return isValid;
  }

  return (
    <div className="flex items-start">
      <Sidebar />
      <div className="flex-1 h-screen overflow-auto">
        <TopBar />
        <div className="px-8 py-4">
          <div className="flex flex-col pb-8 w-[500px]">
            <h3 className="font-archivo text-2xl leading-[48px] text-heading font-semibold">
              Account
            </h3>
            <div className="flex items-start gap-6 w-full">
              <div className="w-[50%]">
                <Input
                  type="text"
                  hasLabel
                  label="First Name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  hasError={error.firstNameError !== ""}
                  error={error.firstNameError}
                  disabled={isLoading}
                />
              </div>
              <div className="w-[50%]">
                <Input
                  type="text"
                  hasLabel
                  label="Last Name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  hasError={error.lastNameError !== ""}
                  error={error.lastNameError}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Input
              type="email"
              hasLabel
              label="Email"
              value={user.email}
              disabled
            />
            <Dropdown
              id="selectTimeZone"
              label="Select Time Zone"
              isDisabled={isLoading}
              onClick={(value) => setSelectedTimezone(value?.id)}
              options={timezones}
              selectedOption={{
                id: selectedTimezone,
                name: selectedTimezone,
              }}
              hasError={error.timeZoneError !== ""}
              error={error.timeZoneError}
            />
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
            <div className="flex items-center gap-8 mt-4">
              <Button
                buttonText="Cancel"
                buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-subHeading text-white"
                onClick={handleCancel}
                isDisabled={isLoading}
              />
              <Button
                buttonText="Update"
                buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
                onClick={handleUpdate}
                isLoading={isLoading}
                isDisabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
