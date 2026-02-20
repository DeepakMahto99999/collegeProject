import Session from "../models/Session.model.js";



// TODAY STATS - completed

export const getTodayStats = async (req, res) => {
  try {

    const userId = req.user.userId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const sessions = await Session.find({
      userId,
      completed: true,
      startTime: { $gte: start }
    }).lean();

    const totalSeconds = sessions.reduce(
      (acc, s) => acc + (s.totalFocusSeconds || 0),
      0
    );

    return res.json({
      success: true,
      sessions: sessions.length,
      focusMinutes: Math.round(totalSeconds / 60)
    });

  } catch (err) {
    console.error("Today stats error:", err);
    res.status(500).json({ success: false });
  }
};



// RECENT SESSIONS (TIMELINE)
// BOTH COMPLETE + INCOMPLETE
// Because this is timeline / activity history, not performance metric.
export const getRecentSessions = async (req, res) => {
  try {

    const userId = req.user.userId;
    const limit = Number(req.query.limit) || 5;

    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const mapped = sessions.map(s => ({

      topic: s.topic,
      focusLength: s.focusLength,
      startedAt: s.startTime,
      status: s.status,

      statusLabel:
        s.status === "COMPLETED" ? "Completed" :
        s.status === "INVALID" ? "Stopped" :
        s.status === "RUNNING" ? "Running" :
        "Not Started"

    }));

    res.json({
      success: true,
      sessions: mapped
    });

  } catch (err) {
    console.error("Recent stats error:", err);
    res.status(500).json({ success: false });
  }
};




// WEEKLY GRAPH DATA - completed 

export const getWeeklyStats = async (req, res) => {
  try {

    const userId = req.user.userId;

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const sessions = await Session.find({
      userId,
      completed: true,
      startTime: { $gte: start }
    }).lean();

    const daily = {
      Mon: 0, Tue: 0, Wed: 0,
      Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };

    sessions.forEach(s => {

      const day = s.startTime.toLocaleDateString(
        "en-US",
        { weekday: "short" }
      );

      daily[day] += (s.totalFocusSeconds || 0) / 60;

    });

    res.json({
      success: true,
      daily
    });

  } catch (err) {
    console.error("Weekly stats error:", err);
    res.status(500).json({ success: false });
  }
};



// DAILY PATTERN - ONLY COMPLETED
export const getDailyPattern = async (req, res) => {
  try {

    const userId = req.user.userId;

    const sessions = await Session.find({
      userId,
      completed: true
    }).lean();

    const buckets = {};

    sessions.forEach(s => {

      const hour = s.startTime.getHours();
      const bucket = `${Math.floor(hour / 2) * 2}:00`;

      buckets[bucket] =
        (buckets[bucket] || 0) +
        (s.totalFocusSeconds || 0) / 60;

    });

    res.json({
      success: true,
      pattern: buckets
    });

  } catch (err) {
    console.error("Daily pattern error:", err);
    res.status(500).json({ success: false });
  }
};



// ===============================
// MONTHLY GRAPH - Mixed 
// Hours → All sessions
// Session count → Only completed
export const getMonthlyStats = async (req, res) => {
  try {

    const userId = req.user.userId;

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const sessions = await Session.find({
      userId,
      startTime: { $gte: start }
    }).lean();

    const monthly = {};

    sessions.forEach(s => {

      const week =
        `Week ${Math.ceil(s.startTime.getDate() / 7)}`;

      if (!monthly[week]) {
        monthly[week] = { hours: 0, sessions: 0 };
      }

      monthly[week].hours +=
        (s.totalFocusSeconds || 0) / 3600;

      if (s.completed) {
        monthly[week].sessions += 1;
      }

    });

    res.json({
      success: true,
      monthly
    });

  } catch (err) {
    console.error("Monthly stats error:", err);
    res.status(500).json({ success: false });
  }
};
