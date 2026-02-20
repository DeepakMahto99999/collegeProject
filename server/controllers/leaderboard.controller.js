import User from "../models/User.model.js";


// ===============================
// GET LEADERBOARD
// ===============================
export const getLeaderboard = async (req, res) => {
  try {

    const userId = req.user.userId;

    // ---- Parallel Queries ----
    const [topUsers, currentUser] = await Promise.all([

      User.find()
        .select("name avatar totalSessions currentStreak points")
        .sort({ points: -1 })
        .limit(50)
        .lean(),

      User.findById(userId)
        .select("name avatar totalSessions currentStreak points")
        .lean()
    ]);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ---- Current Rank ----
    const higherUsersCount = await User.countDocuments({
      points: { $gt: currentUser.points }
    });

    const currentRank = higherUsersCount + 1;

    // ---- Add isCurrentUser Flag ----
    const leaderboard = topUsers.map(u => ({
      ...u,
      isCurrentUser: u._id.toString() === userId
    }));


    return res.json({
      success: true,

      leaderboard,

      currentUser: {
        rank: currentRank,
        ...currentUser
      }

    });

  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ success: false });
  }
};
