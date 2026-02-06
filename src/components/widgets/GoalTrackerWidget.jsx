import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function GoalTrackerWidget({ config, entries }) {
  const goal = config.weeklyGoal || 5;

  const entriesThisWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const startStr = startOfWeek.toISOString().split('T')[0];

    return entries.filter(e => e.date && e.date >= startStr).length;
  }, [entries]);

  const progress = Math.min(entriesThisWeek / goal, 1);
  const completed = progress >= 1;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="goal-tracker-widget">
      <div className="goal-tracker-widget__ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--glass-3)"
            strokeWidth="8"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={completed ? 'var(--success-text)' : 'var(--accent)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="goal-tracker-widget__count">
          <span className="goal-tracker-widget__count-value">{entriesThisWeek}</span>
          <span className="goal-tracker-widget__count-label">of {goal}</span>
        </div>
      </div>
      <span className="goal-tracker-widget__label">
        Entries this week
      </span>
      {completed && (
        <motion.span
          className="goal-tracker-widget__celebration"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 10 }}
        >
          Goal reached!
        </motion.span>
      )}
    </div>
  );
}
