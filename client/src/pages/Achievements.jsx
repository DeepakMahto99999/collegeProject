// Import React and useState hook
import React, { useState } from 'react';

// Import motion for animations
import { motion } from 'framer-motion';

// Import icons used in achievements page
import { Trophy, Filter, Lock, Unlock } from 'lucide-react';

// Import reusable Button component
import { Button } from '@/components/ui/button';

// Import AchievementBadge component (single card)
import AchievementBadge from '@/components/ui/AchievementBadge';

// Import dummy achievements data
import { achievements } from '@/utils/dummyData';

// -------------------- ACHIEVEMENTS PAGE --------------------
const Achievements = () => {

  // Filter state: controls which achievements are shown
  const [filter, setFilter] = useState('all'); 
  // Possible values: 'all', 'unlocked', 'locked'

  // Filter achievements based on selected filter
  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true; // all
  });

  // Count unlocked achievements
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Total number of achievements
  const totalCount = achievements.length;

  // Overall progress percentage
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="container mx-auto px-4 py-8">

      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-4xl font-bold mb-2">
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Collect badges and celebrate your productivity milestones
        </p>
      </motion.div>

      {/* OVERALL PROGRESS CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">

          {/* Trophy icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Trophy className="h-10 w-10" />
          </div>

          {/* Progress details */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-2xl font-bold mb-2">
              {unlockedCount} of {totalCount} Unlocked
            </h2>

            <p className="text-muted-foreground mb-3">
              Keep focusing to unlock more achievements!
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-md mx-auto md:mx-0">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {progressPercent}% complete
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FILTER BUTTONS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center mb-8"
      >
        <div className="inline-flex rounded-lg bg-muted p-1">
          {[
            { key: 'all', label: 'All', icon: Filter },
            { key: 'unlocked', label: 'Unlocked', icon: Unlock },
            { key: 'locked', label: 'Locked', icon: Lock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)} // Change filter
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ACHIEVEMENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement, index) => (
          <AchievementBadge
            key={achievement.id}
            icon={achievement.icon}
            title={achievement.title}
            description={achievement.description}
            unlocked={achievement.unlocked}
            unlockedAt={achievement.unlockedAt}
            progress={achievement.progress}
            target={achievement.target}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* EMPTY STATE (WHEN NO ACHIEVEMENTS MATCH FILTER) */}
      {filteredAchievements.length === 0 && (
        <motion.div className="text-center py-16">
          <h3 className="font-semibold text-lg mb-2">
            No achievements found
          </h3>
        </motion.div>
      )}
    </div>
  );
};

// Export Achievements page
export default Achievements;
