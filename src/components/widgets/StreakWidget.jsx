import { motion } from 'framer-motion';
import { useStreak } from '../../hooks/useStreak';

export default function StreakWidget({ entries }) {
  const { currentStreak, longestStreak, totalEntries } = useStreak(entries);

  return (
    <div className="streak-widget">
      <div className="streak-widget__stat">
        <motion.span
          className="streak-widget__value"
          key={currentStreak}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          {currentStreak}
        </motion.span>
        <span className="streak-widget__label">Current</span>
      </div>
      <div className="streak-widget__stat">
        <motion.span
          className="streak-widget__value"
          key={longestStreak}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
        >
          {longestStreak}
        </motion.span>
        <span className="streak-widget__label">Longest</span>
      </div>
      <div className="streak-widget__stat">
        <motion.span
          className="streak-widget__value"
          key={totalEntries}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        >
          {totalEntries}
        </motion.span>
        <span className="streak-widget__label">Total</span>
      </div>
    </div>
  );
}
