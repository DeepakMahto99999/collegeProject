import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";

import {
  getAllAchievementsApi,
  getAchievementsPreviewApi,
} from "../api/achievements.api.js";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const Achievements = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["achievements-page"],
    queryFn: async () => {
      const [allRes, previewRes] = await Promise.all([
        getAllAchievementsApi(),
        getAchievementsPreviewApi(),
      ]);

      return {
        all: allRes.data.data,
        preview: previewRes.data.data,
      };
    },
    staleTime: 1000 * 30,
  });

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-500">
        Failed to load achievements.
      </div>
    );
  }

  const { all, preview } = data;

  const unlockedIds = new Set(
    preview.recentUnlocked.map(
      (a) => a.achievementId?._id || a.achievementId
    )
  );

  const progressMap = {};
  preview.inProgress.forEach((item) => {
    progressMap[item.achievementId] = item;
  });

  return (
    <div className="p-6 space-y-8">

      {/* SUMMARY */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-sm text-muted-foreground">
          {preview.unlockedCount} / {preview.totalCount} unlocked
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {all.map((ach) => {
          const isUnlocked = unlockedIds.has(ach._id);
          const progress = progressMap[ach._id];

          return (
            <motion.div
              key={ach._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-6 relative ${
                  isUnlocked
                    ? "border-2 border-primary bg-primary/5"
                    : "opacity-70"
                }`}
              >
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                  {isUnlocked ? (
                    <Trophy className="text-yellow-500" />
                  ) : (
                    <Lock className="text-muted-foreground" />
                  )}
                  <h3 className="font-semibold">{ach.title}</h3>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {ach.description}
                </p>

                {/* Progress */}
                {!isUnlocked && progress && (
                  <div className="space-y-2">
                    <Progress
                      value={(progress.progress / progress.target) * 100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {progress.progress} / {progress.target}
                    </p>
                  </div>
                )}

                {/* Unlocked Badge */}
                {isUnlocked && (
                  <p className="text-xs text-primary font-medium">
                    Unlocked
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;