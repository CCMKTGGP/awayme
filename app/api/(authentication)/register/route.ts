import { NextResponse } from "next/server";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connect from "@/lib/db";
import User from "@/lib/models/user";
import { cookies } from "next/headers";
import { verificationEmailTemplate } from "@/utils/verificationEmailTempelate";
import { sendEmail } from "@/utils/sendEmail";
import { IUser } from "@/context/userContext";
import Plan from "@/lib/models/plan";
import { Types } from "mongoose";
import { PlanTypes } from "@/utils/planTypes";

function getVerificationToken(user: IUser): string {
  // Generate the token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // Hash the token
  user.verifyToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  user.verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000);
  return verificationToken;
}

export const POST = async (request: Request) => {
  try {
    const { firstName, lastName, email, password, timeZone } =
      await request.json();

    // encrypt the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // establish the connection with database
    await connect();

    // check if the user is already present or not
    const user = await User.findOne({ email });
    if (user) {
      return new NextResponse(
        JSON.stringify({
          message: "User already present with this email. Please try Login!",
        }),
        { status: 400 }
      );
    }

    // fetch all plans
    const plans = await Plan.find();

    const freePlan: any = plans.filter(
      (plan) => plan.planId === PlanTypes.FREE.toLowerCase()
    );

    // create the new user object
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      numberOfRetries: 0,
      plan: new Types.ObjectId(freePlan?.[0]?._id),
      timeZone,
    });

    // generate a verification token for the user and save it in the database
    const verificationToken = getVerificationToken(newUser);
    await newUser.save();

    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?verifyToken=${verificationToken}&id=${newUser?._id}`;
    const message = verificationEmailTemplate(verificationLink);
    // Send verification email
    await sendEmail(newUser?.email, "Email Verification", message);

    // create a jwt token and send it as a resppnse
    const token = jwt.sign({ newUser }, process.env.TOKEN_SECRET || "sign");

    const response = { ...newUser?._doc, token };

    cookies().set({
      name: "userData",
      value: JSON.stringify(response),
      httpOnly: true,
      path: "/",
    });

    return new NextResponse(
      JSON.stringify({ message: "User created successfully!", data: response }),
      {
        status: 201,
      }
    );
  } catch (err) {
    return new NextResponse("Error in creating users " + err, { status: 500 });
  }
};
