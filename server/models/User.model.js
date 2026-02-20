import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    focusLength: {
      type: Number,
      default: 25
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },

    // -------- STATS --------
    totalSessions: {
      type: Number,
      default: 0,
    },

    totalFocusMinutes: {
      type: Number,
      default: 0,
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    points: {
      type: Number,
      default: 0,
    },

    level: {
      type: Number,
      default: 1
    },

    lastSessionDate: {
      type: Date,
    },
    antiCheatScore: {
      type: Number,
      default: 100
    },
    lastActiveAt: {
      type: Date
    }

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
