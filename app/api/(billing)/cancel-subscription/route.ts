import Calendar from "@/lib/models/calendar";
import Plan from "@/lib/models/plan";
import User from "@/lib/models/user";
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
  const user = await User.findById(userId);
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

  // check if the number of user calendars are less than 1
  // (because as the user is canceling we will throw him to free plan)
  // (and we only allow one calendar in free plan so if the user has more than one calendar)
  // (we will tell him to delete the calendars)
  if (calendars.length > 1) {
    // throw an error stating that user does not enough credits to import
    return new NextResponse(
      JSON.stringify({
        message: `You have too many calendars imported. Free Plan only allows 1 calendar. Please delete some of them and then try again!`,
      }),
      { status: 400 }
    );
  }

  try {
    // fetch all plans
    const plans = await Plan.find();

    const freePlan: any = plans.filter(
      (plan) => plan.planId === PlanTypes.FREE.toLowerCase()
    );
    let responseMessage = "";

    // Handle subscription cancellation
    if (user.subscriptionId) {
      try {
        // Cancel the Stripe subscription
        await stripe.subscriptions.cancel(user.subscriptionId);
        // Update the user's record: clear subscriptionId and plan
        user.subscriptionId = null;
        user.plan = new Types.ObjectId(freePlan?.[0]?._id);
        user.planType = null;

        await user.save();
        responseMessage += "Subscription canceled successfully! ";
      } catch (error) {
        return new NextResponse(
          JSON.stringify({ message: "Failed to cancel subscription!" }),
          { status: 500 }
        );
      }
    }

    // Handle refund for one-time payments
    if (user.paymentIntentId) {
      try {
        user.paymentIntentId = null;
        user.plan = new Types.ObjectId(freePlan?.[0]?._id);
        user.planType = null;
        await user.save();
        responseMessage += "Subscription canceled successfully! ";
      } catch (error) {
        return new NextResponse(
          JSON.stringify({ message: "Failed to cancel payment!" }),
          { status: 500 }
        );
      }
    }

    return new NextResponse(
      JSON.stringify({
        message: responseMessage,
        data: user,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new NextResponse("Error in canceling subscription " + error, {
      status: 500,
    });
  }
}
