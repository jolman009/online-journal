import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries.jsx';
import { useTodos } from '../hooks/useTodos';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { buildEntryDateMap, buildTodoDateSet } from '../hooks/useCalendar';
import EntryCard from '../components/EntryCard';
import Calendar from '../components/Calendar';
import TodosWidget from '../components/TodosWidget';
import TagFilter from '../components/TagFilter';
import FloatingActionButton from '../components/FloatingActionButton';
import PullToRefresh from '../components/PullToRefresh';
import QuickCaptureModal from '../components/QuickCaptureModal';
import { exportEntries } from '../utils/export';

export default function Journal() {
  const { entries, fetchEntries, deleteEntry, togglePin, quickAddEntry } = useEntries();
  const { todos, fetchTodos } = useTodos();
  const [filterDate, setFilterDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchEntries();
    fetchTodos();
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchEntries(), fetchTodos()]);
  }, [fetchEntries, fetchTodos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut: Q for quick capture
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setShowQuickCapture(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickSave = useCallback(async ({ content, mood }) => {
    await quickAddEntry(content, mood);
  }, [quickAddEntry]);

  const entryDateMap = buildEntryDateMap(entries);
  const todoDateSet = buildTodoDateSet(todos);

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    entries.forEach(e => (e.tags || []).forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  }, [entries]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

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

    if (selectedTags.length > 0) {
      filtered = filtered.filter(e =>
        selectedTags.every(tag => (e.tags || []).includes(tag))
      );
    }

    // Sort pinned entries first
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [entries, filterDate, debouncedQuery, selectedTags]);

  const {
    displayedItems: paginatedEntries,
    hasMore,
    isLoadingMore,
    loaderRef,
    totalCount,
    displayedCount,
  } = useInfiniteScroll(displayedEntries, 20);

  const formattedFilterDate = filterDate
    ? new Date(filterDate + 'T00:00:00Z').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Your Journal Entries</h2>
          <p className="muted">Newest first. Synced across your devices.</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => exportEntries(entries)}
            disabled={entries.length === 0}
          >
            Export JSON
          </button>
          <Link className="btn primary" to="/new-entry">Add new entry</Link>
        </div>
      </div>

      <div className="journal-search">
        <input
          ref={searchInputRef}
          type="text"
          className="journal-search__input"
          placeholder="Search entries by title or content... (press / to focus)"
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

      <TagFilter
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggle={handleTagToggle}
        onClear={() => setSelectedTags([])}
      />

      <div className="calendar-widget">
        <Calendar
          entryDateMap={entryDateMap}
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

      {displayedEntries.length > 0 && totalCount > 20 && (
        <div className="entries-count muted">
          Showing {displayedCount} of {totalCount} entries
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
          paginatedEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} onTogglePin={togglePin} />
          ))
        )}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="infinite-scroll-loader">
          {isLoadingMore ? (
            <span className="infinite-scroll-loader__spinner"></span>
          ) : (
            <span className="muted">Scroll for more</span>
          )}
        </div>
      )}

      <FloatingActionButton
        onClick={() => setShowQuickCapture(true)}
        label="Quick capture"
      />

      <QuickCaptureModal
        isOpen={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
        onSave={handleQuickSave}
      />
    </PullToRefresh>
  );
}
