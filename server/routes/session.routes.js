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
import { handleSessionEvent } from "../controllers/sessionEvents.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { completeSessionSchema, heartbeatSchema, resetSessionSchema, sessionEventSchema, startSessionSchema, videoEventSchema } from "../validators/session.validator.js";

const router = express.Router();

// 🔹 Sync popup state
router.get("/current", authUser, getCurrentSession);

// 🔹 Create ARMED session
router.post("/start", authUser, validate(startSessionSchema) , startSession);

// 🔹 AI validation when video changes
router.post("/video-event", authUser, validate(videoEventSchema) , videoEvent);

// 🔹 Heartbeat focus accumulation
router.post("/heartbeat/:sessionId", authUser, validate(heartbeatSchema) , heartbeatFocus);

// 🔹 Complete session
router.post("/complete/:sessionId", authUser, validate(completeSessionSchema) , completeSession);

// 🔹 Manual reset
router.post("/reset/:sessionId", authUser, validate(resetSessionSchema) , resetSession); 

router.post("/:sessionId/events", authUser, validate(sessionEventSchema) ,  handleSessionEvent)

export default router;
