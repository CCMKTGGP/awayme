"use client";
import React, { useEffect, useState } from "react";
import Input from "../components/input";
import Button from "../components/button";
import AuthHeader from "../components/auth-header";
import ApiError from "../components/api-error";
import { postData } from "@/utils/fetch";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/userContext";
import Link from "next/link";
import Dropdown from "../components/dropdown";
import { getAllTimezones } from "@/utils/time";

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezones, setTimezones] = useState<any[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [error, setError] = useState({
    emailError: "",
    passwordError: "",
    confirmPasswordError: "",
    firstNameError: "",
    lastNameError: "",
    timeZoneError: "",
    apiError: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // CONTEXT
  const { setUser } = useUserContext();

  useEffect(() => {
    const { tzNames, currentTimezone } = getAllTimezones();
    setTimezones(tzNames?.map((tz) => ({ id: tz, name: tz })));
    // set current timezone as a default selection
    setSelectedTimezone(currentTimezone);
  }, []);

  function checkEmail() {
    if (!email) {
      setError((error) => ({
        ...error,
        emailError: "Email is required",
      }));
      return false;
    }
    if (!email.includes("@")) {
      setError((error) => ({
        ...error,
        emailError: "Please enter a valid email",
      }));
      return false;
    }
    setError((error) => ({
      ...error,
      emailError: "",
    }));
    return true;
  }

  function checkFirstName() {
    if (!firstName) {
      setError((error) => ({
        ...error,
        firstNameError: "First Name is required",
      }));
      return false;
    }
    setError((error) => ({
      ...error,
      firstNameError: "",
    }));
    return true;
  }

  function checkLastName() {
    if (!lastName) {
      setError((error) => ({
        ...error,
        lastNameError: "Last Name is required",
      }));
      return false;
    }
    setError((error) => ({
      ...error,
      lastNameError: "",
    }));
    return true;
  }

  function checkPassword() {
    if (!password) {
      setError((error) => ({
        ...error,
        passwordError: "Password is required",
      }));
      return false;
    }
    setError((error) => ({
      ...error,
      passwordError: "",
    }));
    return true;
  }

  function checkConfirmPassword() {
    if (password !== confirmPassword) {
      setError((error) => ({
        ...error,
        confirmPasswordError: "Passwords do not match",
      }));
      return false;
    }
    setError((error) => ({
      ...error,
      confirmPasswordError: "",
    }));
    return true;
  }
  

  function handleTimezoneChange(timeZone: string) {
    setSelectedTimezone(timeZone);
  }

  async function handleSignUp() {
    const ALL_CHECKS_PASS = [
      checkPassword(),
      checkEmail(),
      checkFirstName(),
      checkLastName(),
      checkConfirmPassword(),
    ].every(Boolean);

    if (!ALL_CHECKS_PASS) return;

    setIsLoading(true);
    try {
      const response = await postData("/api/register", {
        firstName,
        lastName,
        email,
        password,
        timeZone: selectedTimezone,
      });
      const { data } = response;
      if (data) {
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("userId", data._id);
            localStorage.setItem("token", data.token);
          }
        } catch (error) {
          console.error("Error while setting token in localStorage:", error);
        }
        setUser(data);
        return router.push(`/email-not-verified`);
      }
    } catch (err: any) {
      setError((error) => ({
        ...error,
        apiError: err.message,
      }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col">
      <AuthHeader />
      <div className="h-[110vh] flex items-center justify-center gap-20">
        <img
          src="./auth-illustration.png"
          alt="Auth Illustration"
          className="h-[400px]"
        />
        <div className="w-[500px] shadow-card p-8 rounded-[12px] border border-stroke/20">
          <h1 className="font-archivo text-3xl leading-[56px] font-bold text-heading">
            {"Let's Get Started 🚀"}
          </h1>
          <p className="font-archivo text-lg leading-[36px] text-subHeading">
            Create an account
          </p>
          <form className="pt-4">
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
              value={email}
              placeholder="Enter your email address"
              onChange={(event) => setEmail(event.target.value)}
              hasError={error.emailError !== ""}
              error={error.emailError}
              disabled={isLoading}
            />
            <Input
              type="password"
              hasLabel
              label="Password"
              value={password}
              placeholder="Enter your password"
              onChange={(event) => setPassword(event.target.value)}
              hasError={error.passwordError !== ""}
              error={error.passwordError}
              disabled={isLoading}
            />
            <Input
              type="password"
              hasLabel
              label="Confirm Password"
              value={confirmPassword}
              placeholder="Confirm your password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              hasError={error.confirmPasswordError !== ""}
              error={error.confirmPasswordError}
              disabled={isLoading}
            />

            <Dropdown
              id="selectTimeZone"
              label="Select Time Zone"
              isDisabled={isLoading}
              onClick={(value) => handleTimezoneChange(value?.id)}
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
            <Button
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-[250px] justify-center mx-auto my-6"
              buttonText="Sign Up"
              isDisabled={isLoading}
              isLoading={isLoading}
              onClick={() => handleSignUp()}
            />
          </form>
          <div className="py-6">
            <p className="text-subHeading text-md text-center leading-[24px]">
              By continuing you agree to our
              <br />
              <span className="text-accent">
                <Link
                  href={"https://awayme.cc/awayme-terms-and-conditions/"}
                  target="_blank"
                  className="text-heading font-medium underline text-md leading-md px-1"
                >
                  Terms & Conditions
                </Link>
              </span>
              and
              <span className="text-accent">
                <Link
                  href={"https://awayme.cc/awayme-privacy-policy/"}
                  target="_blank"
                  className="text-heading font-medium underline text-md leading-md px-1"
                >
                  Privacy Policy
                </Link>
              </span>
            </p>
          </div>
          <p className="text-center text-subHeading">
            Already have an account?{" "}
            <span className="text-accent">
              <Link
                href={"/login"}
                className="text-accent font-bold underline text-md leading-md"
              >
                Sign In
              </Link>
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
