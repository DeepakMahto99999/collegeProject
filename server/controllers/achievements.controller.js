import Achievement from "../models/Achievement.model.js";
import UserAchievement from "../models/UserAchievement.model.js";
import User from "../models/User.model.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";
import Session from '../models/Session.model.js'


// GET ALL ACHIEVEMENTS (GLOBAL LIST)
export const getAllAchievements = asyncHandler(async (req, res) => {

  const achievements = await Achievement.find({ isActive: true })
    .sort({ threshold: 1 })
    .lean();

  res.json({
    success: true,
    data: achievements
  });
});



// ⭐ DASHBOARD PREVIEW VERSION
export const getAchievementPreview = asyncHandler(async (req, res) => {

  const userId = req.user.userId;

  const [allAchievements, unlockedAchievements, user] = await Promise.all([
    Achievement.find({ isActive: true }).lean(),
    UserAchievement.find({ userId })
      .select("achievementId unlockedAt")
      .populate("achievementId")
      .sort({ unlockedAt: -1 })
      .lean(),
    User.findById(userId).lean()
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const unlockedSet = new Set(
    unlockedAchievements.map(a => a.achievementId._id.toString())
  );

  const inProgress = [];

  for (const ach of allAchievements) {

    if (unlockedSet.has(ach._id.toString())) continue;

    let progress = 0;

    switch (ach.conditionType) {
      case "TOTAL_SESSIONS":
        progress = user.totalSessions;
        break;
      case "TOTAL_MINUTES":
        progress = user.totalFocusMinutes;
        break;
      case "STREAK":
        progress = user.currentStreak;
        break;
      default:
        progress = 0;
    }

    if (progress > 0) {
      inProgress.push({
        achievementId: ach._id,
        title: ach.title,
        icon: ach.icon,
        progress,
        target: ach.threshold
      });
    }
  }

  res.json({
    success: true,
    data: {
      unlockedCount: unlockedAchievements.length,
      totalCount: allAchievements.length,
      recentUnlocked: unlockedAchievements.slice(0, 3),
      inProgress
    }
  });
});


export const checkAndUnlockAchievements = async (userId, session, mongoSession = null) => {

  const user = await User.findById(userId).session(mongoSession);
  if (!user) return;

  const achievements = await Achievement.find({ isActive: true }).session(mongoSession);
  const unlocked = await UserAchievement.find({ userId }).session(mongoSession);

  const unlockedSet = new Set(
    unlocked.map(a => a.achievementId.toString())
  );

  let monthlyMinutes = null;

  const sessionMonth = new Date(session.createdAt).getMonth();
  const sessionYear = new Date(session.createdAt).getFullYear();

  for (const ach of achievements) {

    if (unlockedSet.has(ach._id.toString())) continue;

    let qualifies = false;

    switch (ach.conditionType) {

      case "TOTAL_SESSIONS":
        qualifies = user.totalSessions >= ach.threshold;
        break;

      case "TOTAL_MINUTES":
        qualifies = user.totalFocusMinutes >= ach.threshold;
        break;

      case "STREAK":
        qualifies = user.longestStreak >= ach.threshold;
        break;

      case "MONTHLY_MINUTES":

        if (monthlyMinutes === null) {

          const startOfMonth = new Date(sessionYear, sessionMonth, 1);

          const monthlySessions = await Session.find({
            userId,
            completed: true,
            createdAt: { $gte: startOfMonth }
          })
            .select("totalFocusSeconds")
            .session(mongoSession);

          monthlyMinutes = monthlySessions.reduce(
            (acc, s) => acc + (s.totalFocusSeconds || 0) / 60,
            0
          );
        }

        qualifies = monthlyMinutes >= ach.threshold;
        break;

      default:
        qualifies = false;
    }

    if (qualifies) {
      await UserAchievement.create([{
        userId,
        achievementId: ach._id,
        sourceSessionId: session._id,
        unlockedAt: new Date()
      }], { session: mongoSession });
    }
  }
};
