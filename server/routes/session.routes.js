import express from "express";
import authUser from "../middlewares/auth.middleware.js";

import {
  startSession,
  markSessionRunning,
  heartbeatFocus,
  completeSession,
  cancelSession,
  invalidateSession
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/start", authUser, startSession);

router.post("/running/:sessionId", authUser, markSessionRunning);

router.post("/heartbeat/:sessionId", authUser, heartbeatFocus);

router.post("/complete/:sessionId", authUser, completeSession);

router.post("/cancel/:sessionId", authUser, cancelSession);

router.post("/invalidate/:sessionId", authUser, invalidateSession);

export default router;
