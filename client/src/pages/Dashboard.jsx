// Import React (needed for JSX)
import React from 'react';

// Import Link for navigation without page reload
import { Link } from 'react-router-dom';

// Import animation utilities
import { motion } from 'framer-motion';

// Import icons used in dashboard UI
import { Clock, Target,Flame,TrendingUp,Play,BarChart3,Trophy,Medal,Calendar,
  CheckCircle2, XCircle,ArrowRight } from 'lucide-react';

// Import reusable UI components
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import FeatureCard from '@/components/ui/FeatureCard';
import ProgressRing from '@/components/ui/ProgressRing';
import Testimonials from '@/components/Testimonials';

// Import dummy data (used because no backend yet)
import { dashboardStats, recentSessions, weeklyStats } from '@/utils/dummyData';

// Import helper functions for formatting time
import { formatTimeHoursMinutes, formatRelativeTime } from '@/utils/formatTime';


// -------------------- DASHBOARD COMPONENT --------------------
const Dashboard = () => {

  // Calculate total focus minutes for the week
  const weeklyMinutes = weeklyStats.reduce(
    (acc, day) => acc + day.minutes,
    0
  );

  // Convert minutes into hours
  const weeklyHours = Math.floor(weeklyMinutes / 60);


  // -------------------- UI --------------------
  return (

    <div className="container mx-auto px-4 py-8">

      {/* HERO / GREETING SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}   // start animation
        animate={{ opacity: 1, y: 0 }}    // end animation
        className="mb-8"
      >

        <h1 className="font-display text-4xl font-bold mb-2">
          Welcome back! <span className="wave inline-block">👋</span>
        </h1> 

        <p className="text-muted-foreground text-lg">
          Here's your focus journey at a glance
        </p>
      </motion.div>

      {/* TOP STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Total focus time */}
        <StatCard
          title="Total Focus Time"
          value={formatTimeHoursMinutes(dashboardStats.totalFocusTime)}
          icon={<Clock className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />

        {/* Total sessions completed */}
        <StatCard
          title="Total Sessions"
          value={dashboardStats.totalSessions}
          icon={<Target className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          delay={0.1}
        />

        {/* Streak information */}
        <StatCard
          title="Current Streak"
          value={`${dashboardStats.currentStreak} days`}
          subtitle={`Best: ${dashboardStats.longestStreak} days`}
          icon={<Flame className="h-6 w-6" />}
          delay={0.2}
        />

        {/* Today's progress */}
        <StatCard
          title="Today's Progress"
          value={`${dashboardStats.todayMinutes} min`}
          subtitle={`${dashboardStats.todaySessions} sessions`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={{ value: 15, isPositive: true }}
          delay={0.3}
        />
      </div>



      {/* WEEKLY PROGRESS + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* WEEKLY PROGRESS CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Progress
          </h3>

          {/* Circular progress showing weekly completion */}
          <div className="flex items-center justify-center py-4">
            <ProgressRing
              progress={dashboardStats.weeklyProgress}
              size={160}
              strokeWidth={12}
            >
              <div className="text-center">
                <p className="font-display text-3xl font-bold">
                  {dashboardStats.weeklyProgress}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {weeklyHours}h this week
                </p>
              </div>
            </ProgressRing>
          </div>


          {/* DAILY BAR GRAPH */}
          <div className="grid grid-cols-7 gap-1 mt-4">
            {weeklyStats.map((day) => (
              <div key={day.day} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {day.day}
                </p>

                {/* Height based on minutes focused */}
                <div
                  className="w-full rounded-sm bg-primary transition-all"
                  style={{
                    height: `${Math.max((day.minutes / 180) * 40, 4)}px`,
                    opacity: day.minutes > 0 ? 1 : 0.2
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>



        {/* QUICK ACTION FEATURE CARDS */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Start timer */}
          <FeatureCard
            title="Start Timer"
            description="Begin a 25-minute Pomodoro focus session with distraction blocking"
            icon={Play}
            href="/timer"
            delay={0.5}
          />

          {/* Statistics */}
          <FeatureCard
            title="View Statistics"
            description="Analyze your focus patterns and track progress over time"
            icon={BarChart3}
            href="/statistics"
            delay={0.6}
          />

          {/* Achievements */}
          <FeatureCard
            title="Achievements"
            description="Earn badges and rewards for your dedication"
            icon={Trophy}
            href="/achievements"
            delay={0.7}
          />

          {/* Leaderboard */}
          <FeatureCard
            title="Leaderboard"
            description="Compare your progress with other focused learners"
            icon={Medal}
            href="/leaderboard"
            delay={0.8}
          />
        </div>
      </div>

      {/* RECENT SESSIONS LIST */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass-card rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Sessions
          </h3>

          {/* Link to statistics page */}
          <Link
            to="/statistics"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>


        {/* Individual session cards */}
        <div className="space-y-3">

          {recentSessions.slice(0, 5).map((session, index) => (

            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted"
            >

              {/* Completed / Incomplete icon */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  session.completed
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >

                {session.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div> 

              {/* Session details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {session.videoTitle || 'Focus Session'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(session.date)} · {Math.floor(session.duration / 60)} min
                </p>
              </div>

              {/* Status badge */}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  session.completed
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {session.completed ? 'Completed' : 'Incomplete'}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* TESTIMONIALS SECTION */}
      <Testimonials />

      {/* CALL TO ACTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="text-center py-12"
      >
        <h2 className="font-display text-2xl font-bold mb-4">
          Ready to focus?
        </h2>
        <p className="text-muted-foreground mb-6">
          Start your next Pomodoro session and boost your productivity
        </p>

        <Link to="/timer">
          <Button size="lg" className="btn-gradient gap-2">
            <Play className="h-5 w-5" />
            Start Timer
          </Button>
        </Link>
      </motion.div>

    </div>
  );
};

// Export Dashboard component
export default Dashboard;
