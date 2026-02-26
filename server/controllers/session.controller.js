import mongoose from "mongoose";
import Session from "../models/Session.model.js";
import User from "../models/User.model.js";
import AiCache from "../models/AICache.model.js";
import { checkAndUnlockAchievements } from "./achievements.controller.js";
import { aiJudgeService } from "../services/aiJudge.service.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";


// ============================================================
// Confidence Rule
// ============================================================

function applyConfidenceRule(aiResult) {
  if (!aiResult || typeof aiResult.confidence !== "number") {
    return {
      decision: "INVALID",
      confidence: 0,
      reason: "Invalid AI response"
    };
  }

  const confidence = Math.max(0, Math.min(1, Number(aiResult.confidence)));
  const THRESHOLD = 0.55;

  if (confidence >= THRESHOLD) {
    return {
      decision: "VALID",
      confidence,
      reason: aiResult.reason || "Relevant video"
    };
  }

  return {
    decision: "INVALID",
    confidence,
    reason: aiResult.reason || "Confidence too low"
  };
}


// ============================================================
// Recovery Expiry
// ============================================================

function enforceRecoveryIfExpired(session) {
  if (
    session.recoveryActive &&
    session.recoveryWindowEndsAt &&
    Date.now() > session.recoveryWindowEndsAt.getTime()
  ) {
    session.status = "INVALID";
    session.invalidReason = "TOPIC_MISMATCH";
    session.recoveryActive = false;
    session.recoveryWindowEndsAt = null;
  }
}


// ============================================================
// 1️⃣ GET CURRENT SESSION
// ============================================================

export const getCurrentSession = asyncHandler(async (req, res) => {

  const userId = req.user.userId;

  const session = await Session.findOne({
    userId,
    status: { $in: ["ARMED", "RUNNING"] }
  }).sort({ createdAt: -1 });

  if (session) {
    enforceRecoveryIfExpired(session);
    await session.save();
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    focusLength: user.focusLength,
    session: session
      ? {
          id: session._id,
          topic: session.topic,
          status: session.status,
          startTime: session.startTime,
          invalidReason: session.invalidReason
        }
      : null
  });
});


// ============================================================
// 2️⃣ START SESSION
// ============================================================

export const startSession = asyncHandler(async (req, res) => {

  const userId = req.user.userId;
  const { topic } = req.body;

  const existing = await Session.findOne({
    userId,
    status: { $in: ["ARMED", "RUNNING"] }
  });

  if (existing) {
    throw new AppError("Session already active", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const session = await Session.create({
    userId,
    topic: topic.trim().toLowerCase(),
    focusLength: user.focusLength,
    status: "ARMED"
  });

  res.json({
    success: true,
    sessionId: session._id
  });
});


// ============================================================
// 3️⃣ VIDEO EVENT
// ============================================================

export const videoEvent = asyncHandler(async (req, res) => {

  const userId = req.user.userId;
  const { sessionId, videoId, title, description } = req.body;

  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError("Session not found", 400);
  }

  enforceRecoveryIfExpired(session);

  if (session.status === "INVALID") {
    await session.save();
    return res.json({
      status: session.status,
      invalidReason: session.invalidReason,
      recoveryActive: false,
      recoveryWindowEndsAt: null,
      recoveryCount: session.recoveryCount
    });
  }

  if (session.status === "COMPLETED") {
    throw new AppError("Session already completed", 400);
  }

  let decision;

  const sessionCached = session.validatedVideos?.get(videoId);

  if (sessionCached) {
    decision = sessionCached;
  } else {

    const globalCache = await AiCache.findOne({
      videoId,
      topic: session.topic
    });

    if (globalCache) {

      decision = applyConfidenceRule({
        confidence: globalCache.confidence,
        reason: globalCache.reason
      });

    } else {

      const aiResult = await aiJudgeService({
        topic: session.topic,
        title,
        description
      });

      decision = applyConfidenceRule(aiResult);

      await AiCache.findOneAndUpdate(
        { videoId, topic: session.topic },
        {
          videoId,
          topic: session.topic,
          confidence: decision.confidence, // 🔥 FIXED
          reason: decision.reason
        },
        { upsert: true, new: true }
      );
    }

    session.validatedVideos.set(videoId, decision);
  }

  session.activeVideoId = videoId;

  if (decision.decision === "VALID" && session.status === "ARMED") {
    session.status = "RUNNING";
    session.startTime = new Date();
  }

  if (session.status === "RUNNING") {

    if (decision.decision === "INVALID") {

      if (!session.recoveryActive) {

        if (session.recoveryCount >= 5) {
          session.status = "INVALID";
          session.invalidReason = "TOPIC_MISMATCH";
        } else {
          session.recoveryActive = true;
          session.recoveryWindowEndsAt = new Date(Date.now() + 60000);
          session.recoveryCount += 1;
        }
      }

    } else if (decision.decision === "VALID" && session.recoveryActive) {
      session.recoveryActive = false;
      session.recoveryWindowEndsAt = null;
    }
  }

  try {
    await session.save();
  } catch (err) {
    if (err.name === "VersionError") {
      throw new AppError("Session state changed, retry", 409);
    }
    throw err;
  }

  res.json({
    ...decision,
    status: session.status,
    recoveryActive: session.recoveryActive,
    recoveryWindowEndsAt: session.recoveryWindowEndsAt,
    recoveryCount: session.recoveryCount
  });
});


// ============================================================
// 4️⃣ HEARTBEAT
// ============================================================

export const heartbeatFocus = asyncHandler(async (req, res) => {

  const userId = req.user.userId;
  const { sessionId } = req.params;

  const session = await Session.findOne({
    _id: sessionId,
    userId,
    status: "RUNNING"
  });

  if (!session) {
    throw new AppError("Session not running", 400);
  }

  enforceRecoveryIfExpired(session);

  if (session.status === "INVALID") {
    await session.save();
    throw new AppError("Session invalidated", 400);
  }

  const now = Date.now();

  if (!session.lastHeartbeatAt) {
    session.lastHeartbeatAt = new Date(now);
    await session.save();
    return res.json({ success: true });
  }

  const last = session.lastHeartbeatAt.getTime();
  const diffSeconds = Math.floor((now - last) / 1000);

  if (diffSeconds <= 0) {
    return res.json({ success: false });
  }

  const safeSeconds = Math.min(diffSeconds, 30);

  session.totalFocusSeconds += safeSeconds;
  session.lastHeartbeatAt = new Date(now);

  await session.save();

  res.json({ success: true });
});


// ============================================================
// 5️⃣ COMPLETE SESSION (TRANSACTION)
// ============================================================

export const completeSession = asyncHandler(async (req, res) => {

  const userId = req.user.userId;
  const { sessionId } = req.params;

  const mongoSession = await mongoose.startSession();

  try {

    await mongoSession.withTransaction(async () => {

      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: "RUNNING"
      }).session(mongoSession);

      if (!session) {
        throw new AppError("Session not found", 400);
      }

      const requiredSeconds = session.focusLength * 60;

      if (session.totalFocusSeconds < requiredSeconds) {
        throw new AppError("Focus time not completed", 400);
      }

      if (session.completed) return;

      session.status = "COMPLETED";
      session.completed = true;

      await session.save({ session: mongoSession });

      const user = await User.findById(userId).session(mongoSession);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      user.totalSessions += 1;
      user.totalFocusMinutes += session.focusLength;
      user.points += session.focusLength * 2;

      await user.save({ session: mongoSession });

      await checkAndUnlockAchievements(userId, session, mongoSession);
    });

  } finally {
    mongoSession.endSession();
  }

  res.json({ success: true });
});


// ============================================================
// 6️⃣ RESET SESSION
// ============================================================

export const resetSession = asyncHandler(async (req, res) => {

  const userId = req.user.userId;
  const { sessionId } = req.params;

  const session = await Session.findOne({ _id: sessionId, userId });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  session.status = "INVALID";
  session.invalidReason = "MANUAL_RESET";
  session.completed = false;
  session.activeVideoId = null;

  session.recoveryActive = false;
  session.recoveryWindowEndsAt = null;
  session.recoveryCount = 0;

  await session.save();

  res.json({ success: true });
});