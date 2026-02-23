import express from "express";
import authUser from "../middlewares/auth.middleware.js";

import {
  getCurrentSession,
  startSession,
  videoEvent,
  heartbeatFocus,
  completeSession,
  resetSession
} from "../controllers/session.controller.js";

const router = express.Router();

// 🔹 Sync popup state
router.get("/current", authUser, getCurrentSession);

// 🔹 Create ARMED session
router.post("/start", authUser, startSession);

// 🔹 AI validation when video changes
router.post("/video-event", authUser, videoEvent);

// 🔹 Heartbeat focus accumulation
router.post("/heartbeat/:sessionId", authUser, heartbeatFocus);

// 🔹 Complete session
router.post("/complete/:sessionId", authUser, completeSession);

// 🔹 Manual reset
router.post("/reset/:sessionId", authUser, resetSession);

export default router;
