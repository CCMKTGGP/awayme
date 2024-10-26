import { Schema, model, models } from "mongoose";

const CalendarSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    provider: {
      type: String,
    },
    refresh_token: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Calendar = models.Calendar || model("Calendar", CalendarSchema);
export default Calendar;
