import React from "react";
import { IPlanCardProps } from "./interface";
import Button from "../button";

export default function PlanCard({
  plan,
  isCurrentPlan,
  isPlanFree,
}: IPlanCardProps) {
  const { name, price, features } = plan;
  return (
    <div
      className={`w-[350px] p-6 bg-white shadow-card rounded-[16px] relative border ${
        isCurrentPlan ? "border-heading" : "border-stroke/20"
      }`}
    >
      <div className="h-24">
        <p className="text-base font-bold text-heading">{name}</p>
        {!isPlanFree && (
          <p className="text-sm mt-2 text-heading">Price: {price}</p>
        )}
        {isCurrentPlan && (
          <div className="absolute top-[-10px] right-[20px] inline-block text-xs px-3 py-1 rounded-[8px] bg-heading text-white font-bold">
            Current Plan
          </div>
        )}
      </div>
      <hr className="mb-4" />
      <div className="h-[330px]">
        {features.map((feature, index) => (
          <div className="flex items-center gap-2 py-2" key={index}>
            <img src="/Checkmark.png" alt="" className="w-8 h-8" />
            <p className="text-sm text-heading font-semibold">{feature}</p>
          </div>
        ))}
      </div>
      <hr className="mb-6" />
      <div className="h-12 flex justify-center">
        {!isCurrentPlan && !isPlanFree ? (
          <Button
            buttonText="Upgrade Now"
            buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
            onClick={() => console.log("Upgrade Now")}
          />
        ) : null}
      </div>
    </div>
  );
}
