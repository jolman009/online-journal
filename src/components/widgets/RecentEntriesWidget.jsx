import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const MOOD_EMOJI = { 1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '😄' };

export default function RecentEntriesWidget({ config, entries }) {
  const limit = config.limit || 5;

  const recentEntries = useMemo(() => {
    return entries.slice(0, limit);
  }, [entries, limit]);

  return (
    <div className="recent-entries-widget">
      {recentEntries.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          No entries yet. Start writing!
        </p>
      ) : (
        <div className="recent-entries-widget__list">
          {recentEntries.map(entry => (
            <Link
              key={entry.id}
              to={`/journal?entry=${entry.id}`}
              className="recent-entries-widget__item"
            >
              {entry.mood && (
                <span className="recent-entries-widget__mood">
                  {MOOD_EMOJI[entry.mood] || ''}
                </span>
              )}
              <div className="recent-entries-widget__info">
                <div className="recent-entries-widget__title">
                  {entry.title || 'Untitled'}
                </div>
                <div className="recent-entries-widget__date">
                  {entry.date || ''}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="recent-entries-widget__footer">
        <Link to="/journal">View all entries</Link>
      </div>
    </div>
  );
}
