import express from "express";
import authUser from "../middlewares/auth.middleware.js";

import {
  getTodayStats,
  getRecentSessions,
  getWeeklyStats,
  getDailyPattern,
  getMonthlyStats
} from "../controllers/statistics.controller.js";

const router = express.Router();

router.get("/today", authUser, getTodayStats);

router.get("/recent", authUser, getRecentSessions);

router.get("/weekly", authUser, getWeeklyStats);

router.get("/daily-pattern", authUser, getDailyPattern);

router.get("/monthly", authUser, getMonthlyStats);

export default router;
