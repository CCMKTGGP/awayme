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
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      const subscription = event.data.object as Stripe.Subscription;
      const userIdFromMetadata = subscription.metadata?.userId;
      const plan_id = subscription.metadata?.planId;
      const plan_type = subscription.metadata?.planType;

      if (userIdFromMetadata) {
        await connect();

        const updateFields =
          event.type === "customer.subscription.deleted"
            ? { subscriptionId: null, planType: null }
            : {
                subscriptionId: subscription.id,
                planType: plan_type,
                plan: new Types.ObjectId(plan_id),
              };

        try {
          await User.findOneAndUpdate(
            { _id: userIdFromMetadata },
            updateFields
          );
        } catch (err: any) {
          console.log(
            `Failed to update user for event ${event.type}:`,
            err.message
          );
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
      return new NextResponse("Received", { status: 200 });
  }
};
