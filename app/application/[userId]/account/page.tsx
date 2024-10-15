"use client";

import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import Input from "@/app/components/input";
import Button from "@/app/components/button";
import React, { useState, useEffect } from "react";
import { useUserContext } from "@/context/userContext";
import { postData, putData } from "@/utils/fetch";

export default function Account() {
    const { user, setUser, toggleFetchUserDetails, setToggleFetchUserDetails } = useUserContext();
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [error, setError] = useState({
      firstNameError: "",
      lastNameError: ""
    });
    const [isLoading, setIsLoading] = useState(false);
  
  
    const handleUpdate = async () => {
      setIsLoading(true);
      if (validateFields()) {
        try {
          const url = `/api/users/${user._id}`; 
          const body = { firstName, lastName };
          const updatedUser = await putData(url, body);
          setUser(updatedUser); 
          setToggleFetchUserDetails(!toggleFetchUserDetails);
          console.log("Update successful:", updatedUser);
        } catch (error: any) {
          console.error("Failed to update user details:", error.message);
          setError({
            firstNameError: error.message || "Update failed",
            lastNameError: error.message || "Update failed"
          });
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
      setError({ firstNameError: "", lastNameError: "" }); 
    };
  
    function validateFields() {
      let isValid = true;
      setError({ firstNameError: "", lastNameError: "" });
      if (!firstName) {
        setError(prev => ({ ...prev, firstNameError: "First name is required" }));
        isValid = false;
      }
      if (!lastName) {
        setError(prev => ({ ...prev, lastNameError: "Last name is required" }));
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
