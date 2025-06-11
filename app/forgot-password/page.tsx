"use client";
import { postData } from "@/utils/fetch";
import React from "react";
import AuthHeader from "../components/auth-header";
import Input from "../components/input";
import Button from "../components/button";
import ApiSuccess from "../components/api-success";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState<string>("");
  const [successMessage, setSuccessMessage] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  async function handleSendForgotPasswordEmail() {
    if (!email) {
      return setError("Please enter your email address.");
    }
    setLoading(true);
    try {
      const response = await postData("/api/forgot-password", {
        email,
      });
      const { message } = response;
      setSuccessMessage(message);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex flex-col">
      <AuthHeader />
      <div className="h-[90vh] flex items-center justify-center gap-20">
        <img
          src="./forgot-password.png"
          alt="Forgot Password Illustration"
          className="h-[400px]"
        />
        <div className="w-[500px] shadow-card p-8 rounded-[12px] border border-stroke/20">
          <h1 className="font-archivo text-3xl leading-[56px] font-bold text-heading">
            Reset Your Password
          </h1>
          <p className="font-archivo text-lg leading-[36px] text-subHeading">
            Please set a new password to secure your account.
          </p>

          <form className="w-full max-w-md mx-auto">
            <div className="mb-4">
              <Input
                hasLabel
                type="email"
                id="email"
                required
                label="Email"
                value={email}
                autoComplete="off"
                placeholder="Enter your email address"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                hasError={error !== ""}
                error={error}
                disabled={loading}
              />
            </div>
            <Button
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-[250px] justify-center mx-auto my-6"
              buttonText="Send Email"
              onClick={handleSendForgotPasswordEmail}
              isDisabled={loading}
              isLoading={loading}
            />
            {successMessage && (
              <div className="flex justify-center">
                <ApiSuccess
                  message={successMessage}
                  setMessage={(value) => setSuccessMessage(value)}
                />
              </div>
            )}
            <p className="text-center text-subHeading">
              Back to{" "}
              <span className="text-accent">
                <Link
                  href={"/login"}
                  className="text-accent font-bold underline text-md leading-md"
                >
                  Login
                </Link>
              </span>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
