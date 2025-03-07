"use client";
import { useRouter } from "next/navigation";
import AuthHeader from "./components/auth-header";
import Button from "./components/button";

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex flex-col">
      <AuthHeader hasLinks />
      <div className="h-[90vh] flex items-center justify-center gap-20">
        <div className="w-[500px] p-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-archivo text-3xl leading-[48px] font-bold text-heading">
              Master Your Schedule, Build Credibility, and Find Time for What
              Matters.
            </h1>
            <p className="font-archivo text-lg leading-[36px] text-subHeading">
              Fill your calendar with random events and take ownership of your
              schedule using AwayMe.
            </p>
          </div>
          <Button
            buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-[250px] justify-center my-6"
            buttonText="Get Started for Free"
            onClick={() => router.push("/register")}
          />
        </div>
        <img
          src="./illustration.png"
          alt="Illustration"
          className="h-[400px] rounded-lg"
        />
      </div>
    </main>
  );
}
