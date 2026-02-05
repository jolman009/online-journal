import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { useTodos } from '../hooks/useTodos';
import { buildEntryDateSet, buildTodoDateSet } from '../hooks/useCalendar';
import EntryCard from '../components/EntryCard';
import Calendar from '../components/Calendar';
import TodosWidget from '../components/TodosWidget';

export default function Journal() {
  const { entries, fetchEntries, deleteEntry } = useEntries();
  const { todos, fetchTodos } = useTodos();
  const [filterDate, setFilterDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchTodos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const entryDateSet = buildEntryDateSet(entries);
  const todoDateSet = buildTodoDateSet(todos);

  const displayedEntries = useMemo(() => {
    let filtered = entries;

    if (filterDate) {
      filtered = filtered.filter(e => e.date === filterDate);
    }

    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [entries, filterDate, debouncedQuery]);

  const formattedFilterDate = filterDate
    ? new Date(filterDate + 'T00:00:00Z').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Your Journal Entries</h2>
          <p className="muted">Newest first. Synced across your devices.</p>
        </div>
        <Link className="btn primary" to="/new-entry">Add new entry</Link>
      </div>

      <div className="journal-search">
        <input
          type="text"
          className="journal-search__input"
          placeholder="Search entries by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search journal entries"
        />
        {searchQuery && (
          <button
            type="button"
            className="journal-search__clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      <div className="calendar-widget">
        <Calendar
          entryDateSet={entryDateSet}
          todoDateSet={todoDateSet}
          onDateClick={(dateStr) => setFilterDate(dateStr)}
        />
      </div>

      <TodosWidget todos={todos} />

      {filterDate && (
        <div className="calendar-filter-bar" style={{ display: 'flex' }}>
          <span className="filter-date-label">
            Showing entries for {formattedFilterDate}
          </span>
          <div className="calendar-filter-bar__actions">
            <Link className="btn primary filter-add-link" to={`/new-entry?date=${filterDate}`}>
              Add entry
            </Link>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setFilterDate(null)}
            >
              Show all
            </button>
          </div>
        </div>
      )}

      <div className="entries-grid" aria-live="polite">
        {displayedEntries.length === 0 ? (
          <p className={filterDate || debouncedQuery ? 'muted' : ''}>
            {debouncedQuery
              ? `No entries found for "${debouncedQuery}"${filterDate ? ' on this date' : ''}.`
              : filterDate
                ? 'No entries for this date.'
                : 'No entries yet. Use the "Add Entry" page to begin your journal.'}
          </p>
        ) : (
          displayedEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
          ))
        )}
      </div>
    </>
  );
}
