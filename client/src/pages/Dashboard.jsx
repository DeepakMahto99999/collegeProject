import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Flame,
  Timer,
  Trophy,
  Clock,
  TrendingUp,
} from "lucide-react";

import { getDashboardOverviewApi } from "@/api/dashboard.api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const res = await getDashboardOverviewApi();
      return res.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array(4)
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
        Failed to load dashboard.
      </div>
    );
  }

  const {
    summary,
    weeklyProgress,
    insights,
    achievementsPreview,
  } = data;

  return (
    <div className="p-6 space-y-8">

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <Card className="p-6 flex items-center gap-4">
          <Timer className="text-primary" size={28} />
          <div>
            <p className="text-sm text-muted-foreground">Total Focus Minutes</p>
            <p className="text-2xl font-bold">
              {summary.totalFocusMinutes}
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <Flame className="text-orange-500" size={28} />
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">
              {summary.currentStreak}
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <TrendingUp className="text-green-500" size={28} />
          <div>
            <p className="text-sm text-muted-foreground">Sessions Completed</p>
            <p className="text-2xl font-bold">
              {summary.totalSessions}
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <Trophy className="text-yellow-500" size={28} />
          <div>
            <p className="text-sm text-muted-foreground">Achievements</p>
            <p className="text-2xl font-bold">
              {achievementsPreview.unlockedCount} / {achievementsPreview.totalCount}
            </p>
          </div>
        </Card>

      </div>

      {/* ================= WEEKLY PROGRESS ================= */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Weekly Focus (Minutes)
        </h3>

        <div className="grid grid-cols-7 gap-3 text-center">
          {Object.entries(weeklyProgress.daily).map(([day, value]) => (
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

      {/* ================= INSIGHTS ================= */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Insights
        </h3>

        <div className="flex flex-col md:flex-row gap-6">

          <div className="flex items-center gap-3">
            <Clock size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Peak Focus Time</p>
              <p className="font-medium">
                {insights.peakHourRange}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrendingUp size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Best Day</p>
              <p className="font-medium">
                {insights.bestDay}
              </p>
            </div>
          </div>

        </div>
      </Card>

    </div>
  );
};

export default Dashboard;