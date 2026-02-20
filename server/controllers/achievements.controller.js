import Achievement from "../models/Achievement.model.js";
import UserAchievement from "../models/UserAchievement.model.js";
import User from "../models/User.model.js";


// GET ALL ACHIEVEMENTS (GLOBAL LIST)
export const getAllAchievements = async (req, res) => {
  try {

    const achievements = await Achievement.find({ isActive: true })
      .sort({ threshold: 1 })
      .lean();

    return res.json({
      success: true,
      data: achievements
    });

  } catch (err) {
    console.error("Get achievements error:", err);
    res.status(500).json({ success: false });
  }
};



// ⭐ DASHBOARD PREVIEW VERSION
export const getAchievementPreview = async (req, res) => {
  try {

    const userId = req.user.userId;

    // Parallel queries
    const [allAchievements, unlockedAchievements, user] = await Promise.all([
      Achievement.find({ isActive: true }).lean(),
      UserAchievement.find({ userId })
        .select("achievementId unlockedAt")
        .populate("achievementId")
        .sort({ unlockedAt: -1 })
        .lean(),
      User.findById(userId).lean()
    ]);

    const unlockedSet = new Set(
      unlockedAchievements.map(a => a.achievementId._id.toString())
    );

    // -------- In Progress Calculation --------
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

    return res.json({
      success: true,
      data: {
        unlockedCount: unlockedAchievements.length,
        totalCount: allAchievements.length,
        recentUnlocked: unlockedAchievements.slice(0, 3),
        inProgress
      }
    });

  } catch (err) {
    console.error("Achievement preview error:", err);
    res.status(500).json({ success: false });
  }
};
