import { useMemo } from 'react';

const MOODS = [
  { value: 1, label: 'Awful', emoji: '😢' },
  { value: 2, label: 'Bad', emoji: '😔' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
];

export function useMoodData(entries, days = 30) {
  return useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return entries
      .filter(e => e.mood && e.date && e.date >= cutoffStr)
      .map(e => {
        const moodInfo = MOODS.find(m => m.value === e.mood);
        return {
          date: e.date,
          mood: e.mood,
          label: moodInfo?.label || '',
          emoji: moodInfo?.emoji || '',
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, days]);
}

export { MOODS };
