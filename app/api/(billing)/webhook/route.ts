import connect from "@/lib/db";
import User from "@/lib/models/user";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const POST = async (req: NextRequest) => {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return new NextResponse("Webhook Error: ", { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const planType = session.metadata?.planType;
      const nextCalendarUpdateDate = session.metadata?.nextCalendarUpdateDate;

      const subscriptionId = session.subscription as string; // Capture subscription ID (if applicable)
      const paymentIntentId = session.payment_intent as string; // Capture payment intent ID for one-time payments

      if (userId && planId) {
        try {
          await connect();

          // get user details
          const user = await User.findById(userId);

          // check if the user already has a subscription.
          // if yes then we need to cancel that subscription
          if (user.subscriptionId) {
            // cancel the current subscription
            await stripe.subscriptions.cancel(user.subscriptionId);
            user.subscriptionId = null;
            user.planType = null;
            await user.save();
          }

          let updateData: any = {
            planType,
            plan: new Types.ObjectId(planId),
            nextCalendarUpdateDate,
          };

          // Store subscription ID if it's a subscription product
          if (subscriptionId) {
            updateData.subscriptionId = subscriptionId;
          }

          // Store payment intent ID if it's a one-time payment
          if (paymentIntentId) {
            updateData.paymentIntentId = paymentIntentId;
          }
          await User.findOneAndUpdate({ _id: userId }, updateData);
        } catch (err: any) {
          return new NextResponse("User update failed " + err?.message, {
            status: 500,
          });
        }
      }
      break;
    // case ""

    default:
      console.log(`Unhandled event type ${event.type}`);
      return new NextResponse("Received", { status: 200 });
  }
};
