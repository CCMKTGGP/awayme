"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "@/public/logo.png";
import { useUserContext } from "@/context/userContext";
import Button from "@/app/components/button";

export default function PaymentSuccess() {
  const { user } = useUserContext();
  const router = useRouter();

  const handleNavigateToDashboard = () => {
    router.push(`/application/${user?._id}/dashboard`);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-white">
      <div className="absolute top-4 left-4">
        <Image src={logo} alt="AwayMe Logo" width={150} height={50} />
      </div>
      <div className="p-8 flex flex-col gap-8 border border-stroke/20">
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-archivo text-2xl leading-[48px] text-heading font-semibold">
            Thank you for your purchase!
          </h3>
          <p className="text-center text-base leading-[24px] text-subHeading ">
            You've unlocked the power of peace of mind.
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            buttonText="Go To Dashboard"
            buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
            onClick={handleNavigateToDashboard}
          />
        </div>
      </div>
    </div>
  );
}
