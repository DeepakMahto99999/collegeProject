import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Tv,
  Home,
  MessageSquare,
  Layout,
  PanelLeft,
  ToggleRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProgressRing from '@/components/ui/ProgressRing';
import { useApp } from '@/context/AppContext';
import { formatTime } from '@/utils/formatTime';
import { toast } from '@/hooks/use-toast';

/**
 * Timer Page
 * Pomodoro Timer integrated with YouTube Distraction Controls
 */
const Timer = () => {
  // Global settings from App Context
  const { timerSettings, toggleSettings, updateToggleSettings } = useApp();

  // -------------------- TIMER STATES --------------------

  // Remaining time (in seconds)
  const [timeLeft, setTimeLeft] = useState(timerSettings.focusDuration);

  // Timer status: idle | running | paused
  const [timerState, setTimerState] = useState('idle');

  // Timer mode: focus | shortBreak | longBreak
  const [timerMode, setTimerMode] = useState('focus');

  // Count completed focus sessions
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // -------------------- CALCULATIONS --------------------

  // Get total duration based on current mode
  const totalTime =
    timerMode === 'focus'
      ? timerSettings.focusDuration
      : timerMode === 'shortBreak'
      ? timerSettings.shortBreakDuration
      : timerSettings.longBreakDuration;

  // Calculate progress percentage for circular ring
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Check if ALL distraction toggles are enabled
  const allTogglesEnabled = Object.values(toggleSettings).every(v => v);

  // -------------------- TIMER COMPLETE HANDLER --------------------

  const handleTimerComplete = useCallback(() => {
    // Stop timer
    setTimerState('idle');

    // If focus session ends
    if (timerMode === 'focus') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);

      toast({
        title: '🎉 Focus session complete!',
        description: `Great job! You've completed ${newSessions} session${newSessions > 1 ? 's' : ''} today.`,
      });

      // Every 4th session → long break
      if (newSessions % 4 === 0) {
        setTimerMode('longBreak');
        setTimeLeft(timerSettings.longBreakDuration);
      } else {
        setTimerMode('shortBreak');
        setTimeLeft(timerSettings.shortBreakDuration);
      }
    } 
    // If break ends → return to focus
    else {
      toast({
        title: '☕ Break time over!',
        description: 'Ready to start another focus session?',
      });
      setTimerMode('focus');
      setTimeLeft(timerSettings.focusDuration);
    }
  }, [timerMode, sessionsCompleted, timerSettings]);

  // -------------------- TIMER COUNTDOWN EFFECT --------------------

  useEffect(() => {
    let interval;

    // Run countdown only when timer is running
    if (timerState === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    // When timer reaches zero
    if (timeLeft === 0 && timerState === 'running') {
      handleTimerComplete();
    }

    // Cleanup interval on unmount / state change
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, timeLeft, handleTimerComplete]);

  // -------------------- TIMER CONTROLS --------------------

  // Start timer (only if all toggles are enabled)
  const startTimer = () => {
    if (!allTogglesEnabled) {
      toast({
        title: 'Enable all distractions blockers',
        description: 'For best focus, enable all YouTube distraction toggles.',
        variant: 'destructive',
      });
      return;
    }
    setTimerState('running');
  };

  // Pause timer
  const pauseTimer = () => setTimerState('paused');

  // Reset timer to current mode duration
  const resetTimer = () => {
    setTimerState('idle');
    setTimeLeft(totalTime);
  };

  // Switch timer mode manually
  const switchMode = (mode) => {
    setTimerState('idle');
    setTimerMode(mode);
    setTimeLeft(
      mode === 'focus'
        ? timerSettings.focusDuration
        : mode === 'shortBreak'
        ? timerSettings.shortBreakDuration
        : timerSettings.longBreakDuration
    );
  };

  // Enable all distraction toggles at once
  const enableAllToggles = () => {
    updateToggleSettings({
      hideShorts: true,
      hideHome: true,
      hideComments: true,
      hideRecommendations: true,
      hideSidebar: true,
    });

    toast({
      title: 'All distractions blocked!',
      description: 'Maximum focus mode enabled.',
    });
  };

  // Toggle configuration list
  const toggleItems = [
    { key: 'hideShorts', label: 'Hide Shorts', icon: Tv, description: 'Remove YouTube Shorts from view' },
    { key: 'hideHome', label: 'Hide Home', icon: Home, description: 'Block the homepage feed' },
    { key: 'hideComments', label: 'Hide Comments', icon: MessageSquare, description: 'Remove comment sections' },
    { key: 'hideRecommendations', label: 'Hide Recommendations', icon: Layout, description: 'Block suggested videos' },
    { key: 'hideSidebar', label: 'Hide Sidebar', icon: PanelLeft, description: 'Remove the sidebar' },
  ];

  // -------------------- UI --------------------

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Pomodoro Timer</h1>
        <p className="text-muted-foreground">Stay focused with the Pomodoro Technique</p>
      </motion.div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TIMER SECTION */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8">
          
          {/* Mode Selector */}
          <div className="flex justify-center gap-2 mb-8">
            {['focus', 'shortBreak', 'longBreak'].map(mode => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timerMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="flex justify-center mb-8">
            <ProgressRing progress={progress} size={280} strokeWidth={12}>
              <div className="text-center">
                <motion.p key={timeLeft} className="font-display text-6xl font-bold">
                  {formatTime(timeLeft)}
                </motion.p>
                <p className="text-muted-foreground mt-2">
                  {timerMode === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
                </p>
              </div>
            </ProgressRing>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {timerState === 'running' ? (
              <Button onClick={pauseTimer}><Pause /> Pause</Button>
            ) : (
              <Button onClick={startTimer}><Play /> Start</Button>
            )}
            <Button variant="ghost" onClick={resetTimer}><RotateCcw /> Reset</Button>
          </div>

          {/* Sessions Counter */}
          <div className="text-center mt-8 pt-6 border-t">
            Sessions completed today: <strong>{sessionsCompleted}</strong>
          </div>
        </motion.div>

        {/* TOGGLES SECTION */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings2 />
              <h3 className="font-semibold">Distraction Controls</h3>
            </div>
            <Button size="sm" variant="outline" onClick={enableAllToggles}>
              <ToggleRight /> Enable All
            </Button>
          </div>

          {!allTogglesEnabled && (
            <div className="mb-4 flex gap-2 p-3 bg-warning/10 text-warning rounded-lg">
              <AlertTriangle /> Enable all toggles for maximum focus!
            </div>
          )}

          {allTogglesEnabled && (
            <div className="mb-4 flex gap-2 p-3 bg-success/10 text-success rounded-lg">
              <CheckCircle2 /> All distractions blocked!
            </div>
          )}

          {toggleItems.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex gap-3">
                <Icon />
                <div>
                  <Label>{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={toggleSettings[key]}
                onCheckedChange={checked => updateToggleSettings({ [key]: checked })}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Timer;
