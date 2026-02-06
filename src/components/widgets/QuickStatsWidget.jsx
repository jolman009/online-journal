import { useMemo } from 'react';

export default function QuickStatsWidget({ config, entries, todos }) {
  const stats = config.stats || ['total_entries', 'total_todos', 'completion_rate', 'avg_mood'];

  const computed = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const totalEntries = entries.length;
    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
    const entriesWithMood = entries.filter(e => e.mood);
    const avgMood = entriesWithMood.length > 0
      ? (entriesWithMood.reduce((sum, e) => sum + e.mood, 0) / entriesWithMood.length).toFixed(1)
      : '—';
    const entriesThisMonth = entries.filter(e => e.date && e.date >= monthStart).length;

    return {
      total_entries: { value: totalEntries, label: 'Entries' },
      total_todos: { value: totalTodos, label: 'Todos' },
      completion_rate: { value: `${completionRate}%`, label: 'Completed' },
      avg_mood: { value: avgMood, label: 'Avg Mood' },
      entries_this_month: { value: entriesThisMonth, label: 'This Month' },
    };
  }, [entries, todos]);

  return (
    <div className="quick-stats-widget">
      {stats.map(key => {
        const stat = computed[key];
        if (!stat) return null;
        return (
          <div key={key} className="quick-stats-widget__item">
            <span className="quick-stats-widget__value">{stat.value}</span>
            <span className="quick-stats-widget__label">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
