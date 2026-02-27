import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Flame, Calendar } from "lucide-react";

import {
  getTodayStatsApi,
  getRecentStatsApi,
  getWeeklyStatsApi,
  getDailyPatternApi,
  getMonthlyStatsApi,
} from "@/api/statistics.api";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Statistics = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["statistics-page"],
    queryFn: async () => {
      const [
        todayRes,
        recentRes,
        weeklyRes,
        dailyRes,
        monthlyRes,
      ] = await Promise.all([
        getTodayStatsApi(),
        getRecentStatsApi(5),
        getWeeklyStatsApi(),
        getDailyPatternApi(),
        getMonthlyStatsApi(),
      ]);

      return {
        today: todayRes.data,
        recent: recentRes.data.sessions,
        weekly: weeklyRes.data.daily,
        dailyPattern: dailyRes.data.pattern,
        monthly: monthlyRes.data.monthly,
      };
    },
    staleTime: 1000 * 30,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-500">
        Failed to load statistics.
      </div>
    );
  }

  const { today, recent, weekly, dailyPattern, monthly } = data;

  return (
    <div className="p-6 space-y-10">

      {/* ================= TODAY ================= */}
      <Card className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Flame className="text-orange-500" />
          <div>
            <p className="text-sm text-muted-foreground">Today's Sessions</p>
            <p className="text-2xl font-bold">{today.sessions}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Focus Minutes</p>
            <p className="text-2xl font-bold">{today.focusMinutes}</p>
          </div>
        </div>
      </Card>

      {/* ================= WEEKLY ================= */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Weekly Focus (Minutes)</h3>
        <div className="grid grid-cols-7 gap-3 text-center">
          {Object.entries(weekly).map(([day, value]) => (
            <div key={day}>
              <p className="text-sm text-muted-foreground">{day}</p>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.min(value, 120)}px` }}
                transition={{ duration: 0.5 }}
                className="bg-primary rounded mt-2"
              />
              <p className="text-xs mt-1">{Math.round(value)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= RECENT SESSIONS ================= */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Sessions</h3>
        <div className="space-y-3">
          {recent.map((s, i) => (
            <div
              key={i}
              className="flex justify-between text-sm bg-muted/50 p-3 rounded-lg"
            >
              <span>{s.topic}</span>
              <span className="text-muted-foreground">
                {s.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= DAILY PATTERN ================= */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Daily Pattern</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          {Object.entries(dailyPattern).map(([bucket, value]) => (
            <div key={bucket} className="bg-muted/50 p-3 rounded">
              <p className="text-xs text-muted-foreground">{bucket}</p>
              <p className="font-semibold">{Math.round(value)} min</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= MONTHLY ================= */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Monthly Overview</h3>
        <div className="space-y-3">
          {Object.entries(monthly).map(([week, data]) => (
            <div
              key={week}
              className="flex justify-between bg-muted/50 p-3 rounded-lg"
            >
              <span>{week}</span>
              <span>
                {Math.round(data.hours)} hrs • {data.sessions} sessions
              </span>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default Statistics;