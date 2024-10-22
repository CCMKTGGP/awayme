import Calendar from "@/lib/models/calendar";
import Plan from "@/lib/models/plan";
import User from "@/lib/models/user";
import PAYMENT_CONSTANTS from "@/utils/payments";
import { PlanTypes } from "@/utils/planTypes";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!);

export async function POST(req: NextRequest) {
  const { planId, userId } = await req.json();

  // check if the planId exist and is valid
  if (!planId || !Types.ObjectId.isValid(planId)) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid or missing planId!" }),
      { status: 400 }
    );
  }

  // get plan details
  const plan = await Plan.findById(planId);
  if (!plan) {
    return new NextResponse(
      JSON.stringify({ message: "Plan does not exist!" }),
      { status: 400 }
    );
  }

  // check if the user id exists and is valid
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid or missing userId!" }),
      { status: 400 }
    );
  }

  // get user details
  const user = await User.findById(userId).populate({
    path: "plan",
    select: ["_id", "planId", "name", "numberOfCalendarsAllowed"],
  });
  if (!user) {
    return new NextResponse(
      JSON.stringify({ message: "User does not exist!" }),
      { status: 400 }
    );
  }

  // fetch all the calendars of the user
  const calendars = await Calendar.find({
    user: new Types.ObjectId(user._id),
  });

  // check if the number of user calendars are less than the number of calendars allowed for seleected plan
  if (calendars.length > plan?.numberOfCalendarsAllowed) {
    // throw an error stating that user does not enough credits to import
    return new NextResponse(
      JSON.stringify({
        message: `You have too many calendars imported. ${plan?.name} only allows ${plan?.numberOfCalendarsAllowed} calendars to be imported. Please delete some of them and then try again!`,
      }),
      { status: 400 }
    );
  }

  let priceId: string | undefined;
  let mode: any;

  switch (plan?.planId) {
    case PlanTypes.LIFETIME.toLowerCase():
      priceId = process.env.STRIPE_PRICE_ID_LIFETIME;
      mode = PAYMENT_CONSTANTS.PAYMENT_MODE;
      break;
    case PlanTypes.MONTHLY.toLowerCase():
      priceId = process.env.STRIPE_PRICE_ID_MONTHLY;
      mode = PAYMENT_CONSTANTS.SUBSCRIPTION_MODE;
      break;
    case PlanTypes.ANNUAL.toLowerCase():
      priceId = process.env.STRIPE_PRICE_ID_YEARLY;
      mode = PAYMENT_CONSTANTS.SUBSCRIPTION_MODE;
      break;
    default:
      return new NextResponse(
        JSON.stringify({ message: "Invalid plan type!" }),
        { status: 400 }
      );
  }

  // Validate that priceId is not undefined
  if (!priceId) {
    return new NextResponse(
      JSON.stringify({
        message: "Price ID not defined for the selected plan!",
      }),
      { status: 400 }
    );
  }

  // Metadata for Checkout session
  const metadata = {
    userId: String(userId),
    planType: String(plan?.planId), // e.g., 'lifetime', 'monthly', 'annual'
    planId: String(planId), // Plan ID to track what plan the user is purchasing
    nextCalendarUpdateDate: "", // Optional, depending on your logic
  };

  try {
    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      customer_email: user.email,
      billing_address_collection: "required",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/application/${userId}/payment-success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/application/${userId}/billing`,
      metadata,
    });

    return new NextResponse(
      JSON.stringify({
        message: "Url Created successfully!",
        data: { sessionUrl: session.url, metadata: metadata },
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new NextResponse("Error in checkout " + error, {
      status: 500,
    });
  }
}
