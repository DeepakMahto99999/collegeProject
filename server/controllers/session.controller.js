import Session from "../models/Session.model.js";
import User from "../models/User.model.js";
import AiCache from "../models/AICache.model.js";
import { checkAndUnlockAchievements } from "./achievements.controller.js";
import { aiJudgeService } from "../services/aiJudge.service.js"; // you must implement

// ============================================================
// 1️⃣ GET CURRENT SESSION (Popup Sync Authority)
// ============================================================
export const getCurrentSession = async (req, res) => {
  try {
    const userId = req.user.userId;

    const session = await Session.findOne({
      userId,
      status: { $in: ["ARMED", "RUNNING"] }
    }).sort({ createdAt: -1 });

    const user = await User.findById(userId).lean();

    return res.json({
      focusLength: user?.focusLength || 25,
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

  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

// ============================================================
// 2️⃣ START SESSION (Create ARMED Session)
// ============================================================
export const startSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topic } = req.body;

    if (!topic || topic.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Valid topic required" });
    }

    const existing = await Session.findOne({
      userId,
      status: { $in: ["ARMED", "RUNNING"] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Session already active"
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false });

    const session = await Session.create({
      userId,
      topic: topic.trim().toLowerCase(),
      focusLength: user.focusLength,
      status: "ARMED",
      startTime: null,
      totalFocusSeconds: 0,
      totalHiddenSeconds: 0,
      hiddenEventCount: 0,
      totalPauseSeconds: 0,
      pauseEventCount: 0,
      validatedVideos: {},
      activeVideoId: null,
      completed: false
    });

    return res.json({
      success: true,
      sessionId: session._id
    });

  } catch {
    return res.status(500).json({ success: false });
  }
};

// ============================================================
// 3️⃣ VIDEO EVENT (AI PIPELINE — THE BRAIN)
// ============================================================
export const videoEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId, videoId, title, description } = req.body;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session || session.status === "INVALID" || session.status === "COMPLETED") {
      return res.status(400).json({ success: false });
    }

    // 🔁 1. Session-level cache
    const sessionCached = session.validatedVideos?.get(videoId);
    if (sessionCached) {
      return res.json(sessionCached);
    }

    // 🔁 2. Global AI Cache
    const globalCache = await AiCache.findOne({
      videoId,
      topic: session.topic
    });

    let decision;

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
          confidence: aiResult.confidence,
          reason: aiResult.reason
        },
        { upsert: true, new: true }
      );
    }

    // Save inside session-level cache
    session.validatedVideos.set(videoId, decision);
    session.activeVideoId = videoId;

    // 🔄 State transition
    if (decision.decision === "VALID" && session.status === "ARMED") {
      session.status = "RUNNING";
      session.startTime = new Date();
    }

    await session.save();

    return res.json(decision);

  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

// ============================================================
// 4️⃣ HEARTBEAT (Server Focus Accumulation)
// ============================================================
export const heartbeatFocus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId,
      status: "RUNNING"
    });

    if (!session) {
      return res.status(400).json({ success: false });
    }

    const now = Date.now();

    // If first heartbeat after RUNNING
    if (!session.lastHeartbeatAt) {
      session.lastHeartbeatAt = new Date(now);
      await session.save();
      return res.json({ success: true });
    }

    const last = new Date(session.lastHeartbeatAt).getTime();
    const diffSeconds = Math.floor((now - last) / 1000);

    // Reject if too fast (spam)
    if (diffSeconds <= 0) {
      return res.json({ success: false });
    }

    // Cap max heartbeat gain (anti-cheat)
    const safeSeconds = Math.min(diffSeconds, 30);

    session.totalFocusSeconds += safeSeconds;
    session.lastHeartbeatAt = new Date(now);

    await session.save();

    return res.json({ success: true });

  } catch (err) {
    console.error("Heartbeat error:", err);
    return res.status(500).json({ success: false });
  }
};

// ============================================================
// 5️⃣ COMPLETE SESSION
// ============================================================
export const completeSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId,
      status: "RUNNING"
    });

    if (!session) {
      return res.status(400).json({ success: false });
    }

    const requiredSeconds = session.focusLength * 60;

    if (session.totalFocusSeconds < requiredSeconds) {
      return res.status(400).json({
        success: false,
        message: "Focus time not completed"
      });
    }

    if (session.completed) {
      return res.json({ success: true });
    }

    session.status = "COMPLETED";
    session.completed = true;

    await session.save();

    const user = await User.findById(userId);

    user.totalSessions += 1;
    user.totalFocusMinutes += session.focusLength;
    user.points += session.focusLength * 2;

    await user.save();

    await checkAndUnlockAchievements(userId, session);

    return res.json({ success: true });

  } catch {
    return res.status(500).json({ success: false });
  }
};

// ============================================================
// 6️⃣ RESET SESSION
// ============================================================
export const resetSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) return res.status(404).json({ success: false });

    session.status = "INVALID";
    session.invalidReason = "MANUAL_RESET";
    session.completed = false;
    session.activeVideoId = null;

    await session.save();

    return res.json({ success: true });

  } catch {
    return res.status(500).json({ success: false });
  }
};

// ============================================================
// Confidence Rule Helper
// ============================================================
function applyConfidenceRule(aiResult) {
  // 1️⃣ Validate AI response structure
  if (
    !aiResult ||
    typeof aiResult.confidence !== "number"
  ) {
    return {
      decision: "INVALID",
      confidence: 0,
      reason: "Invalid AI response format"
    };
  }

  // 2️⃣ Normalize confidence safely between 0–1
  const confidence = Math.max(
    0,
    Math.min(1, Number(aiResult.confidence))
  );

  const THRESHOLD = 0.55; // You can tune this later

  // 3️⃣ Backend policy decision
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
