"use client";

import { useUserContext } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthHeader from "../components/auth-header";
import Input from "../components/input";
import ApiError from "../components/api-error";
import Button from "../components/button";
import Link from "next/link";
import { postData } from "@/utils/fetch";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({
    emailError: "",
    passwordError: "",
    apiError: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // CONTEXT
  const { setUser } = useUserContext();

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

  async function handleLogin() {
    const ALL_CHECKS_PASS = [checkPassword(), checkEmail()].every(Boolean);

    if (!ALL_CHECKS_PASS) return;

    setIsLoading(true);
    try {
      const response = await postData("/api/login", {
        email,
        password,
      });
      const { data } = response;
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("userId", data._id);
          localStorage.setItem("token", data.token);
        }
      } catch (error) {
        console.error("Error while setting token in localStorage:", error);
      }
      setUser(data);
      if (!data?.isVerified) {
        return router.push(`/email-not-verified`);
      }
      return router.push(`/application/${data?._id}/dashboard`);
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
      <div className="h-[90vh] flex items-center justify-center gap-20">
        <img
          src="./auth-illustration.png"
          alt="Auth Illustration"
          className="h-[400px]"
        />
        <div className="w-[500px] shadow-card p-8 rounded-[12px] border border-stroke/20">
          <h1 className="font-archivo text-3xl leading-[56px] font-bold text-heading">
            Welcome Back 👋
          </h1>
          <p className="font-archivo text-lg leading-[36px] text-subHeading">
            Sign in your account
          </p>
          <form className="pt-4">
            <Input
              type="email"
              hasLabel
              value={email}
              label="Email"
              placeholder="Enter your email address"
              onChange={(event) => setEmail(event.target.value)}
              hasError={error.emailError !== ""}
              error={error.emailError}
              disabled={isLoading}
            />
            <Input
              type="password"
              hasLabel
              value={password}
              label="Password"
              placeholder="Enter your password"
              onChange={(event) => setPassword(event.target.value)}
              hasError={error.passwordError !== ""}
              error={error.passwordError}
              disabled={isLoading}
            />
            <div className="flex justify-end mb-8">
              <Link
                href={"/forgot-password"}
                className="font-bold text-primary hover:text-primaryHover underline px-1"
              >
                Forgot Password
              </Link>
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
            <Button
              isDisabled={isLoading}
              isLoading={isLoading}
              buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-[250px] justify-center mx-auto my-6"
              buttonText="Log In"
              onClick={() => handleLogin()}
            />
            <div className="py-6">
              <p className="text-subHeading text-md text-center leading-[24px]">
                By continuing you agree to our <br />
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
              Do not have an account?{" "}
              <span className="text-accent">
                <Link
                  href={"/register"}
                  className="text-accent font-bold underline text-md leading-md"
                >
                  Sign Up
                </Link>
              </span>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
