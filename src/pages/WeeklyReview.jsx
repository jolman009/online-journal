import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { useTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';

function getWeekBounds(ref) {
  const d = new Date(ref);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShort(d) {
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyReview() {
  const { entries, fetchEntries } = useEntries();
  const { todos, fetchTodos, toggleTodo, deleteTodo } = useTodos();
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchEntries();
    fetchTodos();
  }, []);

  const refDate = new Date();
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const { monday, sunday } = getWeekBounds(refDate);
  const mondayStr = toDateStr(monday);
  const sundayStr = toDateStr(sunday);

  const weekEntries = entries.filter(
    (e) => e.date >= mondayStr && e.date <= sundayStr
  );

  const weekTodos = todos.filter(
    (t) => t.date && t.date >= mondayStr && t.date <= sundayStr
  );
  const completedTodos = weekTodos.filter((t) => t.completed);
  const pendingTodos = weekTodos.filter((t) => !t.completed);

  const entryDateSet = new Set(weekEntries.map((e) => e.date));
  const todayStr = toDateStr(new Date());

  const weekDays = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toDateStr(d);
    return {
      label,
      dateStr,
      hasEntry: entryDateSet.has(dateStr),
      isToday: dateStr === todayStr,
    };
  });

  const daysWithEntries = weekDays.filter((d) => d.hasEntry).length;

  const prevWeek = () => setWeekOffset((o) => o - 1);
  const nextWeek = () => setWeekOffset((o) => o + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  const reflectionLink = `/new-entry?date=${sundayStr}&template=weekly`;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Weekly Review</p>
          <h2>Your Week at a Glance</h2>
          <p className="muted">Track your writing, tasks, and habits.</p>
        </div>
        <Link className="btn primary" to={reflectionLink}>
          Write Weekly Reflection
        </Link>
      </div>

      <div className="review-week-selector">
        <button
          className="cal-nav-btn"
          type="button"
          aria-label="Previous week"
          onClick={prevWeek}
        >
          &#8249;
        </button>
        <span className="review-week-selector__label">
          Week of {formatShort(monday)} &ndash; {formatShort(sunday)}, {sunday.getFullYear()}
        </span>
        <button
          className="cal-nav-btn"
          type="button"
          aria-label="Next week"
          onClick={nextWeek}
        >
          &#8250;
        </button>
        {weekOffset !== 0 && (
          <button
            className="btn ghost review-week-selector__today"
            type="button"
            onClick={goToCurrentWeek}
          >
            Today
          </button>
        )}
      </div>

      <div className="review-stats">
        <div className="review-stat">
          <span className="review-stat__value">{weekEntries.length}</span>
          <span className="review-stat__label">Entries Written</span>
        </div>
        <div className="review-stat">
          <span className="review-stat__value">{completedTodos.length}</span>
          <span className="review-stat__label">Todos Completed</span>
        </div>
        <div className="review-stat">
          <span className="review-stat__value">{pendingTodos.length}</span>
          <span className="review-stat__label">Todos Pending</span>
        </div>
        <div className="review-stat">
          <span className="review-stat__value">{daysWithEntries}/7</span>
          <span className="review-stat__label">Days with Entries</span>
        </div>
      </div>

      <div className="review-heatmap">
        {weekDays.map((day) => {
          let cellClass = 'review-heatmap__cell';
          if (day.hasEntry) cellClass += ' review-heatmap__cell--filled';
          if (day.isToday) cellClass += ' review-heatmap__cell--today';
          return (
            <div key={day.dateStr} className={cellClass}>
              <span className="review-heatmap__label">{day.label}</span>
              <span className="review-heatmap__dot" />
            </div>
          );
        })}
      </div>

      <section className="review-section">
        <h3 className="review-section__title">Entries This Week</h3>
        {weekEntries.length === 0 ? (
          <p className="muted">No entries this week yet.</p>
        ) : (
          <div className="review-entries">
            {weekEntries
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((entry) => {
                const dateLabel = new Date(entry.date + 'T00:00:00Z').toLocaleDateString(
                  undefined,
                  { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }
                );
                return (
                  <Link
                    key={entry.id}
                    to={`/new-entry?id=${entry.id}`}
                    className="review-entry"
                  >
                    <span className="review-entry__title">{entry.title}</span>
                    <span className="review-entry__date">{dateLabel}</span>
                  </Link>
                );
              })}
          </div>
        )}
      </section>

      <section className="review-section">
        <h3 className="review-section__title">Pending Tasks This Week</h3>
        {pendingTodos.length === 0 ? (
          <p className="muted">No pending tasks for this week.</p>
        ) : (
          <div className="todo-list">
            {pendingTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </div>
        )}
      </section>

      {weekEntries.length > 0 && (
        <div className="callout">
          <div>
            <h3>Ready to reflect?</h3>
            <p>Capture your weekly takeaways before the week ends.</p>
          </div>
          <Link className="btn primary" to={reflectionLink}>
            Write Reflection
          </Link>
        </div>
      )}
    </>
  );
}
