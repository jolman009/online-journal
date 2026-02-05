import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { useTodos } from '../hooks/useTodos';
import { buildEntryDateSet, buildTodoDateSet } from '../hooks/useCalendar';
import Calendar from '../components/Calendar';
import EntryCard from '../components/EntryCard';
import TodoItem from '../components/TodoItem';

export default function CalendarPage() {
  const { entries, fetchEntries, deleteEntry } = useEntries();
  const { todos, fetchTodos, toggleTodo, deleteTodo } = useTodos();
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchEntries();
    fetchTodos();
  }, []);

  const entryDateSet = buildEntryDateSet(entries);
  const todoDateSet = buildTodoDateSet(todos);

  const matchingEntries = selectedDate
    ? entries.filter(e => e.date === selectedDate)
    : [];
  const matchingTodos = selectedDate
    ? todos.filter(t => t.date === selectedDate)
    : [];

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00Z').toLocaleDateString(undefined, {
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
          <p className="eyebrow">Overview</p>
          <h2>Calendar</h2>
          <p className="muted">Click a date to see your entries.</p>
        </div>
        <Link className="btn ghost" to="/journal">Back to journal</Link>
      </div>

      <div className="calendar-widget calendar-widget--full">
        <Calendar
          entryDateSet={entryDateSet}
          todoDateSet={todoDateSet}
          onDateClick={(dateStr) => setSelectedDate(dateStr)}
        />
      </div>

      {selectedDate && (
        <div className="calendar-entries" style={{ display: 'block' }}>
          <div className="calendar-entries__header">
            <h3>Entries for {formattedDate}</h3>
            <Link className="btn primary" to={`/new-entry?date=${selectedDate}`}>
              Add entry for this date
            </Link>
          </div>

          {matchingEntries.length === 0 ? (
            <p className="muted">No entries for this date.</p>
          ) : (
            <div className="entries-grid">
              {matchingEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
              ))}
            </div>
          )}

          {matchingTodos.length > 0 && (
            <>
              <h4 className="calendar-todos__heading">Tasks for this date</h4>
              <div className="todo-list">
                {matchingTodos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
