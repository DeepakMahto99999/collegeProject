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


export const checkAndUnlockAchievements = async (userId, session, mongoSession = null) => {

  try {

    const user = await User.findById(userId).session(mongoSession)
    if (!user) return;

    const achievements = await Achievement.find({ isActive: true }).session(mongoSession)
    const unlocked = await UserAchievement.find({ userId }).session(mongoSession)

    const unlockedSet = new Set(
      unlocked.map(a => a.achievementId.toString())
    );

    // Calculate monthly minutes INCLUDING this session
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
            }).session(mongoSession);

            monthlyMinutes = monthlySessions.reduce(
              (acc, s) => acc + s.focusLength,
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
          unlockedAt: new Date()
        }], { session: mongoSession });
      }

    }

  } catch (err) {
    console.error("Unlock achievement error:", err);
  }
};
