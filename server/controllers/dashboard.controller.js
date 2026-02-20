import User from "../models/User.model.js";
import Session from "../models/Session.model.js";
import Achievement from "../models/Achievement.model.js";
import UserAchievement from "../models/UserAchievement.model.js";


// ===============================
// DASHBOARD OVERVIEW (MAIN API)
// ===============================
export const getDashboardOverview = async (req, res) => {
  try {

    const userId = req.user.userId;

    // ---- DATE RANGES ----
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0,0,0,0);

    // ---- PARALLEL FETCH ----
    const [
      user,
      todaySessions,
      recentSessions,
      weekSessions,
      allAchievements,
      unlockedAchievements
    ] = await Promise.all([

      User.findById(userId).lean(),

      Session.find({
        userId,
        completed:true,
        startTime:{ $gte: todayStart }
      }).lean(),

      Session.find({ userId })
        .sort({ createdAt:-1 })
        .limit(5)
        .lean(),

      Session.find({
        userId,
        completed:true,
        startTime:{ $gte: weekStart }
      }).lean(),

      Achievement.find({ isActive:true }).lean(),

      UserAchievement.find({ userId })
        .select("achievementId unlockedAt")
        .lean()
    ]);



    // ================= TODAY STATS =================
    const todayFocusMinutes =
      todaySessions.reduce(
        (acc,s)=> acc + (s.totalFocusSeconds || 0),
        0
      ) / 60;



    // ================= WEEKLY PROGRESS =================
    const daily = {
      Mon:0, Tue:0, Wed:0, Thu:0,
      Fri:0, Sat:0, Sun:0
    };

    let totalMinutesThisWeek = 0;

    weekSessions.forEach(s=>{
      const day = s.startTime.toLocaleDateString(
        "en-US",
        { weekday:"short" }
      );

      const mins = (s.totalFocusSeconds||0)/60;

      if(daily[day] !== undefined){
        daily[day]+=mins;
      }

      totalMinutesThisWeek+=mins;
    });



    // ================= RECENT TIMELINE =================
    const timeline = recentSessions.map(s=>({

      topic:s.topic,
      focusLength:s.focusLength,
      startedAt:s.startTime,
      status:s.status,

      statusLabel:
        s.status==="COMPLETED" ? "Completed" :
        s.status==="INVALID" ? "Stopped" :
        s.status==="RUNNING" ? "Running" :
        "Not Started"
    }));



    // ================= INSIGHTS =================
    const hourBucket = {};
    const dayBucket = {};

    weekSessions.forEach(s=>{

      const h = s.startTime.getHours();
      hourBucket[h] = (hourBucket[h]||0)+1;

      const d = s.startTime.toLocaleDateString(
        "en-US",
        { weekday:"long" }
      );

      dayBucket[d] =
        (dayBucket[d]||0)+s.totalFocusSeconds;
    });

    const peakHour =
      Object.entries(hourBucket)
        .sort((a,b)=> b[1]-a[1])[0]?.[0] || 0;

    const bestDay =
      Object.entries(dayBucket)
        .sort((a,b)=> b[1]-a[1])[0]?.[0] || "N/A";



    // ================= ACHIEVEMENTS PREVIEW =================
    const unlockedSet =
      new Set(
        unlockedAchievements.map(a =>
          a.achievementId.toString()
        )
      );

    const unlockedCount = unlockedAchievements.length;
    const totalCount = allAchievements.length;



    // ================= FINAL RESPONSE =================
    return res.json({
      success:true,

      summary:{
        totalFocusMinutes:user.totalFocusMinutes,
        totalSessions:user.totalSessions,
        currentStreak:user.currentStreak,
        longestStreak:user.longestStreak,
        todayFocusMinutes,
        todaySessions: todaySessions.length
      },

      weeklyProgress:{
        totalMinutesThisWeek,
        daily
      },

      recentSessions: timeline,

      insights:{
        peakHourRange:`${peakHour}-${Number(peakHour)+2}`,
        bestDay
      },

      achievementsPreview:{
        unlockedCount,
        totalCount
      }

    });

  } catch(err){
    console.error("Dashboard error:",err);
    res.status(500).json({ success:false });
  }
};
