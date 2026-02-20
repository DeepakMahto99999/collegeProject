// React core and hook for state management
import React, { useState } from 'react';

// Framer Motion for animations
import { motion } from 'framer-motion';

// Icons used in leaderboard UI
import { Medal, Trophy, Flame, Target, Crown, Award } from 'lucide-react';

// Dummy leaderboard data (can be replaced by API later)
import { leaderboardData } from '@/utils/dummyData';

// Utility function to merge Tailwind class names safely
import { cn } from '@/lib/utils';

// Leaderboard Page Component
const Leaderboard = () => {

  // State to decide how leaderboard should be sorted
  // Possible values: "points", "sessions", "streak"
  const [sortBy, setSortBy] = useState('points');

  // -------- SORT LEADERBOARD DATA --------
  // 1. Copy leaderboardData (to avoid mutating original)
  // 2. Sort based on selected filter
  // 3. Assign rank number after sorting
  const sortedData = [...leaderboardData]
    .sort((a, b) => {
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'sessions') return b.totalSessions - a.totalSessions;
      return b.streak - a.streak;
    })
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

  // -------- RANK BADGE STYLE FUNCTION --------
  // Returns emoji + colors based on rank position
  const getRankDisplay = (rank) => {
    if (rank === 1)
      return { icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (rank === 2)
      return { icon: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    if (rank === 3)
      return { icon: '🥉', color: 'text-amber-600', bg: 'bg-amber-600/10' };

    // Normal rank styling for others
    return { icon: `${rank}`, color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  // Find logged-in/current user from leaderboard
  const currentUser = leaderboardData.find((u) => u.isCurrentUser);

  return (
    <div className="container mx-auto px-4 py-8">

      {/* ---------------- PAGE HEADER ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Compete with other focused learners worldwide
        </p>
      </motion.div>

      {/* ---------------- CURRENT USER CARD ---------------- */}
      {currentUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8 border-2 border-primary/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">

            {/* User Rank */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-5xl font-bold text-primary">
                #{currentUser.rank}
              </p>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4 flex-1 text-center">

              {/* Sessions */}
              <div>
                <Target className="mx-auto text-primary" />
                <p>{currentUser.totalSessions}</p>
              </div>

              {/* Streak */}
              <div>
                <Flame className="mx-auto text-accent" />
                <p>{currentUser.streak}</p>
              </div>

              {/* Points */}
              <div>
                <Trophy className="mx-auto text-warning" />
                <p>{currentUser.points}</p>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* ---------------- SORT BUTTONS ---------------- */}
      <motion.div className="flex justify-center mb-8">
        <div className="inline-flex bg-muted p-1 rounded-lg">
          {[
            { key: 'points', label: 'Points', icon: Trophy },
            { key: 'sessions', label: 'Sessions', icon: Target },
            { key: 'streak', label: 'Streak', icon: Flame },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)} // change sorting
              className={cn(
                'px-4 py-2 flex items-center gap-2 rounded-md',
                sortBy === key
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ---------------- PODIUM (TOP 3 USERS) ---------------- */}
      <motion.div className="flex justify-center items-end gap-4 mb-8">

        {/* Second Place */}
        <div className="text-center">
          <div className="glass-card p-4">
            {sortedData[1]?.avatar}
            <p>{sortedData[1]?.name}</p>
          </div>
          🥈
        </div>

        {/* First Place */}
        <div className="text-center">
          <div className="glass-card p-4 border border-yellow-500">
            <Crown className="mx-auto text-yellow-500" />
            {sortedData[0]?.avatar}
            <p>{sortedData[0]?.name}</p>
          </div>
          🥇
        </div>

        {/* Third Place */}
        <div className="text-center">
          <div className="glass-card p-4">
            {sortedData[2]?.avatar}
            <p>{sortedData[2]?.name}</p>
          </div>
          🥉
        </div>

      </motion.div>

      {/* ---------------- FULL LEADERBOARD TABLE ---------------- */}
      <motion.div className="glass-card overflow-hidden">

        {/* Table Header */}
        <div className="grid grid-cols-12 p-4 bg-muted font-medium">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">User</div>
          <div className="col-span-2 text-center">Sessions</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-2 text-right">Points</div>
        </div>

        {/* Table Rows */}
        {sortedData.map((user, index) => {
          const rankStyle = getRankDisplay(user.rank);

          return (
            <motion.div
              key={user.name}
              className={cn(
                'grid grid-cols-12 p-4 items-center',
                user.isCurrentUser && 'bg-primary/5'
              )}
            >
              {/* Rank */}
              <div className="col-span-1">
                <span className={cn('rounded-full px-2', rankStyle.bg)}>
                  {rankStyle.icon}
                </span>
              </div>

              {/* User */}
              <div className="col-span-5 flex gap-2">
                {user.avatar}
                <span>{user.name}</span>
              </div>

              {/* Sessions */}
              <div className="col-span-2 text-center">
                {user.totalSessions}
              </div>

              {/* Streak */}
              <div className="col-span-2 text-center">
                🔥 {user.streak}
              </div>

              {/* Points */}
              <div className="col-span-2 text-right">
                {user.points}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ---------------- POINTS EXPLANATION ---------------- */}
      <motion.div className="mt-8 glass-card p-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Award /> How Points are Calculated
        </h3>

        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>✔ 50 points per focus session</li>
          <li>✔ 10 × streak days</li>
          <li>✔ Bonus points for achievements</li>
        </ul>
      </motion.div>

    </div>
  );
};

export default Leaderboard;
