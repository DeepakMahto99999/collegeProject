// React core + hook for state
import React, { useState } from 'react';

// Framer Motion for animations
import { motion } from 'framer-motion';

// Icons used in statistics UI
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';

// Reusable UI components
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';

// Dummy data (later replaceable with API)
import {
  weeklyStats,      // weekly focus data
  monthlyStats,     // monthly aggregated data
  dailyPattern,     // hourly focus pattern
  monthlyPattern,
  dashboardStats
} from '@/utils/dummyData';

// Chart components from Recharts library
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

// Theme context (light / dark)
import { useTheme } from '@/context/ThemeContext';

// Main Statistics Page Component
const Statistics = () => {

  // State to control which data range is shown
  const [timeRange, setTimeRange] = useState('weekly');

  // Get current theme (dark or light)
  const { theme } = useTheme();

  // Colors for charts depending on theme
  const chartColors = {
    primary: theme === 'dark' ? 'hsl(174, 72%, 50%)' : 'hsl(174, 72%, 40%)',
    primaryLight: theme === 'dark' ? 'hsl(174, 72%, 60%)' : 'hsl(174, 72%, 50%)',
    accent: theme === 'dark' ? 'hsl(16, 85%, 60%)' : 'hsl(16, 85%, 57%)',
    text: theme === 'dark' ? 'hsl(210, 40%, 98%)' : 'hsl(222, 47%, 11%)',
    muted: theme === 'dark' ? 'hsl(215, 20%, 65%)' : 'hsl(215, 16%, 47%)',
    grid: theme === 'dark' ? 'hsl(217, 33%, 20%)' : 'hsl(214, 32%, 91%)',
    background: theme === 'dark' ? 'hsl(222, 47%, 9%)' : 'hsl(0, 0%, 100%)',
  };

  // Custom tooltip shown when hovering over charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg p-3 shadow-lg border border-border">
          <p className="font-medium">{label}</p>

          {/* Show value for each chart line/bar */}
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics from weekly data
  const totalWeeklyMinutes = weeklyStats.reduce((a, b) => a + b.minutes, 0);
  const totalWeeklySessions = weeklyStats.reduce((a, b) => a + b.sessions, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);

  return (
    <div className="container mx-auto px-4 py-8">

      {/* PAGE TITLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">
          Track your focus patterns and productivity trends
        </p>
      </motion.div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Weekly total focus */}
        <StatCard
          title="This Week"
          value={`${Math.floor(totalWeeklyMinutes / 60)}h ${totalWeeklyMinutes % 60}m`}
          subtitle={`${totalWeeklySessions} sessions`}
          icon={<Calendar className="h-6 w-6" />}
        />

        {/* Daily average */}
        <StatCard
          title="Daily Average"
          value={`${avgDailyMinutes} min`}
          subtitle="Focus time"
          icon={<Clock className="h-6 w-6" />}
        />

        {/* Best performance day */}
        <StatCard
          title="Best Day"
          value="Saturday"
          subtitle="180 minutes focused"
          icon={<TrendingUp className="h-6 w-6" />}
        />

        {/* Peak hours */}
        <StatCard
          title="Peak Hours"
          value="4–6 PM"
          subtitle="Most productive time"
          icon={<BarChart3 className="h-6 w-6" />}
        />
      </div>

      {/* TIME RANGE SELECTOR BUTTONS */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-muted rounded-lg p-1">
          {['daily', 'weekly', 'monthly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)} // update state
              className={`px-6 py-2 rounded-md text-sm ${timeRange === range
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ALL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* AREA CHART – Focus Minutes */}
        <motion.div className="glass-card p-6 rounded-xl">
          <h3 className="font-semibold mb-4">Focus Minutes</h3>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  timeRange === 'daily'
                    ? dailyPattern
                    : timeRange === 'weekly'
                      ? weeklyStats
                      : monthlyPattern
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey={
                    timeRange === 'daily'
                      ? 'hour'
                      : timeRange === 'weekly'
                        ? 'day'
                        : 'week'
                  }
                  stroke={chartColors.muted}
                  fontSize={12}
                />

                <YAxis />
                <Tooltip content={<CustomTooltip />} />

                {/* Focus minutes line */}
                <Area
                  dataKey="minutes"
                  stroke={chartColors.primary}
                  fillOpacity={0.3}
                  fill={chartColors.primary}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* BAR CHART – Sessions Completed */}
        <motion.div className="glass-card p-6 rounded-xl">
          <h3 className="font-semibold mb-4">Sessions Completed</h3>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sessions" fill={chartColors.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LINE CHART – Monthly Progress */}
        <motion.div className="glass-card p-6 rounded-xl lg:col-span-2">
          <h3 className="font-semibold mb-4">Monthly Progress</h3>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />

                {/* Hours line */}
                <Line dataKey="hours" stroke={chartColors.primary} />

                {/* Sessions line */}
                <Line dataKey="sessions" stroke={chartColors.accent} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* INSIGHTS SECTION */}
      <motion.div className="glass-card p-6 rounded-xl">
        <h3 className="font-semibold mb-4">💡 Insights</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            Peak productivity is between 4–6 PM
          </div>
          <div className="p-4 bg-accent/5 rounded-lg">
            You focus more on weekends
          </div>
          <div className="p-4 bg-success/5 rounded-lg">
            Consistency improves productivity
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;
