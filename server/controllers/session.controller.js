import Session from "../models/Session.model.js";
import User from "../models/User.model.js";
import { checkAndUnlockAchievements } from "./achievements.controller.js";


// ===============================
// START SESSION (ARMED)
// ===============================
export const startSession = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { topic } = req.body;

    if (!topic || topic.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Valid topic required"
      });
    }

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false });

    const now = new Date();
    const expectedEnd = new Date(
      now.getTime() + user.focusLength * 60 * 1000
    );

    const session = await Session.create({
      userId,
      topic: topic.trim(),
      focusLength: user.focusLength,

      status: "ARMED",

      startTime: now,
      timerStartTime: null,
      timerExpectedEndTime: expectedEnd
    });

    return res.json({
      success: true,
      sessionId: session._id
    });

  } catch (err) {
    console.error("Start session error:", err);
    res.status(500).json({ success: false });
  }
};



// ===============================
// MARK SESSION RUNNING (AI PASSED)
// ===============================
export const markSessionRunning = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId
    });

    if (!session) return res.status(404).json({ success: false });

    // Idempotent safe
    if (session.status !== "ARMED") {
      return res.json({ success: true });
    }

    session.status = "RUNNING";
    session.timerStartTime = new Date();

    await session.save();

    res.json({ success: true });

  } catch (err) {
    console.error("Mark running error:", err);
    res.status(500).json({ success: false });
  }
};



// ===============================
// HEARTBEAT FOCUS TIME UPDATE
// ===============================
export const heartbeatFocus = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { sessionId } = req.params;
    const { seconds } = req.body;

    if (!seconds || seconds <= 0) {
      return res.json({ success: false });
    }

    const session = await Session.findOne({
      _id: sessionId,
      userId,
      status: "RUNNING"
    });

    if (!session) return res.json({ success: false });

    session.totalFocusSeconds += seconds;
    session.lastHeartbeatAt = new Date();

    await session.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};



// ===============================
// INVALIDATE SESSION
// ===============================
export const invalidateSession = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      userId
    });

    if (!session) return res.status(404).json({ success: false });

    if (["COMPLETED", "INVALID"].includes(session.status)) {
      return res.json({ success: true });
    }

    session.status = "INVALID";
    session.invalidReason = reason || "UNKNOWN";
    session.endTime = new Date();

    await session.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};



// ===============================
// COMPLETE SESSION
// ===============================
export const completeSession = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId
    });

    if (!session || session.status !== "RUNNING") {
      return res.status(400).json({ success: false });
    }

    const requiredSeconds = session.focusLength * 60;

    if (session.totalFocusSeconds < requiredSeconds) {
      return res.status(400).json({
        success: false,
        message: "Focus time not completed"
      });
    }

    // Idempotency protection
    if (session.completed) {
      return res.json({ success: true });
    }

    session.status = "COMPLETED";
    session.completed = true;
    session.endTime = new Date();

    await session.save();

    // -------- USER UPDATE --------
    const user = await User.findById(userId);

    user.totalSessions += 1;
    user.totalFocusMinutes += session.focusLength;
    user.points += session.focusLength * 2;

    // ---- STREAK LOGIC ----
    const today = new Date().toDateString();
    const last = user.lastSessionDate?.toDateString();

    if (!last) user.currentStreak = 1;
    else if (last !== today) {
      if (new Date(today) - new Date(last) === 86400000) {
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }
    }

    user.longestStreak = Math.max(
      user.longestStreak,
      user.currentStreak
    );

    user.lastSessionDate = new Date();

    await user.save();

    await checkAndUnlockAchievements(userId, session);

    res.json({ success: true });

  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ success: false });
  }
};



// ===============================
// MANUAL CANCEL
// ===============================
export const cancelSession = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId
    });

    if (!session) return res.status(404).json({ success: false });

    if (session.status === "COMPLETED") {
      return res.json({ success: true });
    }

    session.status = "INVALID";
    session.invalidReason = "MANUAL_CANCEL";
    session.endTime = new Date();

    await session.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};
