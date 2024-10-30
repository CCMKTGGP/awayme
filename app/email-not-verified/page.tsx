"use client";
import React, { useState } from "react";
import Button from "../components/button";
import { useUserContext } from "@/context/userContext";
import ApiSuccess from "../components/api-success";
import ApiError from "../components/api-error";
import { postData } from "@/utils/fetch";

export default function EmailNotVerified() {
  const { user } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState({
    apiError: "",
  });

  async function handleResendVerifyEmail() {
    setLoading(true);
    try {
      const response = await postData(`/api/resend-verification-email`, {
        userId: user?._id,
      });
      const { message } = await response;
      setSuccessMessage(message);
      setLoading(false);
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
      setLoading(false);
    }
  }
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col gap-8 items-center justify-center">
      <img
        src="/email-verification.svg"
        alt="email verification svg"
        className="h-[220px]"
      />
      <div className="flex flex-col gap-2">
        <h1 className="font-archivo text-2xl leading-[48px] text-heading font-semibold text-center">
          Email Verification Required
        </h1>
        <p className="text-base leading-[24px] text-subHeading text-center max-w-[60%] mx-auto">
          We've sent you a confirmation email to the address provided. Please
          click on the link in the email to verify your address.
        </p>
      </div>
      <hr className="w-[60%]" />
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-[24px] text-subHeading text-center">
          Didn't receive the email? Click on the Resend Email below.
        </p>
        {loading ? (
          <p className="text-sm leading-[24px] text-subHeading text-center">
            Sending Email!
          </p>
        ) : (
          <div className="flex justify-center">
            <Button
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
              buttonText="Resend Email"
              onClick={() => handleResendVerifyEmail()}
            />
          </div>
        )}
        {error.apiError && (
          <div className="flex justify-center">
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
          </div>
        )}
        {successMessage && (
          <div className="flex justify-center">
            <ApiSuccess
              message={successMessage}
              setMessage={(value) => setSuccessMessage(value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
