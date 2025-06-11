"use client";
import React, { useEffect, useState } from "react";
import AuthHeader from "../components/auth-header";
import Input from "../components/input";
import Button from "../components/button";
import { useRouter, useSearchParams } from "next/navigation";
import { postData } from "@/utils/fetch";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const id = searchParams.get("id");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !id) {
      setMessage("Invalid or missing token.");
    }
  }, [token, id]);

  async function handleUpdatePassword() {
    if (!password || !confirmPassword) {
      return setMessage("Please enter and confirm your password.");
    }

    if (password !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    setLoading(true);
    try {
      const response = await postData("/api/reset-password", {
        token,
        id,
        newPassword: password,
      });
      const { message } = response;
      setSuccess(true);
      setMessage(message);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setMessage(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex flex-col">
      <AuthHeader />
      <div className="h-[90vh] flex items-center justify-center gap-20">
        <div className="w-[500px] shadow-card p-8 rounded-[12px] border border-stroke/20">
          <h1 className="font-archivo text-3xl leading-[56px] font-bold text-heading">
            Reset Your Password
          </h1>
          <p className="font-archivo text-lg leading-[36px] text-subHeading">
            Please set a new password to secure your account.
          </p>
          {message && (
            <p
              className={`text-sm text-center ${
                success ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {!success && (
            <form className="w-full max-w-md mx-auto">
              <div className="mb-4">
                <Input
                  type="password"
                  hasLabel
                  id="password"
                  required
                  label="New Password"
                  value={password}
                  autoComplete="off"
                  placeholder="Enter your new password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="mb-4">
                <Input
                  type="password"
                  hasLabel
                  id="configmPassword"
                  required
                  label="Confirm Password"
                  value={confirmPassword}
                  autoComplete="off"
                  placeholder="Confirm your new password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button
                buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-[250px] justify-center mx-auto my-6"
                buttonText="Reset Password"
                onClick={handleUpdatePassword}
                isDisabled={loading}
                isLoading={loading}
              />
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
