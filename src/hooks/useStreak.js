import { useMemo } from 'react';

/**
 * Calculate streak statistics from journal entries
 * @param {Array} entries - Array of entry objects with date field (YYYY-MM-DD)
 * @returns {Object} { currentStreak, longestStreak, totalEntries }
 */
export function useStreak(entries) {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalEntries: 0 };
    }

    // Get unique dates with entries, sorted descending
    const uniqueDates = [...new Set(entries.map(e => e.date))]
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalEntries: entries.length };
    }

    // Helper: get previous day string
    const getPrevDay = (dateStr) => {
      const d = new Date(dateStr + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Helper: get next day string
    const getNextDay = (dateStr) => {
      const d = new Date(dateStr + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Helper: get today's date string
    const getTodayStr = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const dateSet = new Set(uniqueDates);
    const todayStr = getTodayStr();
    const yesterdayStr = getPrevDay(todayStr);

    // Calculate current streak
    // Streak is active if there's an entry today OR yesterday
    let currentStreak = 0;
    let startDate = null;

    if (dateSet.has(todayStr)) {
      startDate = todayStr;
    } else if (dateSet.has(yesterdayStr)) {
      startDate = yesterdayStr;
    }

    if (startDate) {
      currentStreak = 1;
      let checkDate = getPrevDay(startDate);
      while (dateSet.has(checkDate)) {
        currentStreak++;
        checkDate = getPrevDay(checkDate);
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    // Sort dates ascending for consecutive checking
    const sortedDates = [...uniqueDates].sort((a, b) => a.localeCompare(b));

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const expectedNext = getNextDay(prevDate);

      if (currDate === expectedNext) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalEntries: entries.length,
    };
  }, [entries]);
}
