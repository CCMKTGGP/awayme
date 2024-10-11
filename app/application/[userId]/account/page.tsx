"use client";

import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import Input from "@/app/components/input";
import Button from "@/app/components/button";
import React, { useState } from "react";

export default function Account() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState({
    firstNameError: "",
    lastNameError: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = () => {
    const isValid = validateFields();
    if (isValid) {
      const updatedAccountInfo = { firstName, lastName };
      console.log("Updated account info:", updatedAccountInfo);
    }
  };

  const handleCancel = () => {
    console.log("Changes cancelled");
  };

  function validateFields() {
    let isValid = true;
    if (!firstName) {
      setError((error) => ({
        ...error,
        firstNameError: "First name is required",
      }));
      isValid = false;
    }
    if (!lastName) {
      setError((error) => ({
        ...error,
        lastNameError: "Last name is required",
      }));
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
            <div className="flex items-center gap-6 w-full">
              <div className="w-[50%]">
                <Input
                  type="text"
                  hasLabel
                  label="First Name"
                  value={firstName}
                  placeholder="Enter your first name"
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
                  placeholder="Enter your last name"
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
              value={"shrey@gmail.com"}
              placeholder="Enter your email address"
              disabled
            />
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
