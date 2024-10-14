import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      unique: true,
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    numberOfRetries: {
      type: Number,
    },
    verifyToken: {
      type: String,
    },
    verifyTokenExpire: {
      type: Date,
    },
    nextCalendarUpdateDate: {
      type: Date,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
    },
    timeZone: {
      type: String,
      default: Intl.DateTimeFormat().resolvedOptions().timeZone, // default time zone is New York
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model("User", UserSchema);
export default User;
