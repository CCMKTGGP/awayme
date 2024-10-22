import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { NextAuthOptions, Session } from "next-auth";
import { cookies } from "next/headers";
import connect from "@/lib/db";
import User from "@/lib/models/user";
import Calendar from "@/lib/models/calendar";
import { Types } from "mongoose";
import { encrypt } from "@/utils/crypto";
import { CalendarTypes } from "@/constants/calendarTypes";
import Plan from "@/lib/models/plan";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/calendar",
          ].join(" "),
          response: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXT_AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account && user) {
        const cookieStore = cookies();
        // fetch the user details from the cookie store
        const userData = JSON.parse(cookieStore.get("userData")?.value || "{}");
        // fetch the calendar name for the cookie store
        const calendarName = cookieStore.get("calendarName")?.value;

        // establish the connection with database
        await connect();

        // load all plans
        await Plan.find({});

        // check if the store exists in the database
        const selectedUser = await User.findById(userData._id).populate({
          path: "plan",
          select: ["_id", "planId", "name", "numberOfCalendarsAllowed"],
        });
        if (!selectedUser) {
          false;
        }

        // check if the calendar exists in the database
        const selectedCalendar = await Calendar.findOne({
          email: user?.email,
          user: new Types.ObjectId(selectedUser._id),
          provider: CalendarTypes.GOOGLE,
        });

        // if the calendar exists in the database
        if (selectedCalendar) {
          // delete the calendar name from the cookies
          cookieStore.delete("calendarName");
          // throw an error stating that the calendar is already in the database
          throw new Error("user's calendar is already imported!");
        }

        // fetch all the calendars of the user
        const calendars = await Calendar.find({
          user: new Types.ObjectId(selectedUser._id),
        });

        // check if the user is allowed to import the calendar based on the plan
        if (calendars.length >= selectedUser?.plan?.numberOfCalendarsAllowed) {
          // delete the calendar name from the cookies
          cookieStore.delete("calendarName");
          // throw an error stating that user does not enough credits to import
          throw new Error(
            "user does not have enough credits to import this calendar. Please upgrade your plan to import more calendars!"
          );
        }

        // extract the access and the refresh token
        const accessToken = account?.access_token || "";
        const refreshToken = account?.refresh_token || "";

        // excrypt the access token and refresh token
        const access_token = encrypt(accessToken);
        const refresh_token = encrypt(refreshToken);

        // add a new calendar in the database
        // create the new calendar object
        // assign user id to the calendar
        const newCalendar = new Calendar({
          name: calendarName,
          email: user?.email,
          access_token,
          refresh_token,
          provider: CalendarTypes.GOOGLE,
          expires_at: account?.expires_at,
          user: new Types.ObjectId(selectedUser._id),
        });

        // save the info in the dabatabse
        await newCalendar.save();

        // delete the calendar name from the cookies
        cookieStore.delete("calendarName");
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
      }
      return token;
    },
  },
  pages: {
    error: "/auth/error",
  },
};

export interface EnrichedSession extends Session {
  provider: string;
  accessToken: string;
  refreshToken: string;
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
