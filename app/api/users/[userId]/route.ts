import { NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/user";
import { Types } from "mongoose";
import Plan from "@/lib/models/plan";

// get user details api
export const GET = async (request: Request, context: { params: any }) => {
  try {
    const userId = context.params.userId;

    // check if the userId exist and is valid
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing userId!" }),
        { status: 400 }
      );
    }

    // establish the database connection
    await connect();

    // load all plans
    await Plan.find({});

    // get user details from userID
    let user = await User.findById(userId).populate({
      path: "plan",
      select: ["_id", "planId", "name", "numberOfCalendarsAllowed"],
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          message: "User does not exist!",
        }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "User Details fetched successfully!",
        data: user,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new NextResponse("Error in fetching user " + err, { status: 500 });
  }
};

// update user api
export const PUT = async (request: Request, context: { params: any }) => {
  try {
    const userId = context.params.userId;
    // extract the fields from the request object
    const { firstName, lastName, timeZone } = await request.json();

    // establish the connection with database
    await connect();

    // check if the userId is valid
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing userId!" }),
        { status: 400 }
      );
    }

    // check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: "User does not exist!" }),
        { status: 400 }
      );
    }

    // update the product
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        firstName,
        lastName,
        timeZone,
      },
      {
        new: true,
      }
    );

    // check if the process successed
    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ message: "User not updated!" }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "User updated successfully!",
        data: updatedUser,
      }),
      {
        status: 200,
      }
    );
  } catch (err) {
    return new NextResponse("Error in updating user " + err, {
      status: 500,
    });
  }
};
