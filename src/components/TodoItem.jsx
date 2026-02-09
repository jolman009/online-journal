import { useState, useMemo } from 'react';

export default function TodoItem({ todo, onToggle, onDelete }) {
  const [completed, setCompleted] = useState(todo.completed);

  const handleToggle = async () => {
    const newState = !completed;
    setCompleted(newState);
    const success = await onToggle(todo.id, newState);
    if (!success) {
      setCompleted(!newState);
    }
  };

  const handleDelete = async () => {
    await onDelete(todo.id);
  };

  const isOverdue = useMemo(() => {
    if (!todo.date || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(todo.date + 'T00:00:00');
    return dueDate < today;
  }, [todo.date, completed]);

  const dateBadge = todo.date
    ? new Date(todo.date + 'T00:00:00Z').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <div className={`todo-item${completed ? ' todo-item--completed' : ''}`}>
      <input
        type="checkbox"
        className="todo-item__checkbox"
        checked={completed}
        onChange={handleToggle}
        aria-label={`Mark as ${completed ? 'incomplete' : 'complete'}`}
      />
      <span className="todo-item__text">{todo.text}</span>
      <span className="todo-item__meta">
        {todo.tags && todo.tags.length > 0 && (
          <span className="todo-item__tags">
            {todo.tags.map(tag => (
              <span key={tag} className="todo-item__tag">{tag}</span>
            ))}
          </span>
        )}
        {dateBadge && (
          <span className={`todo-item__date-badge${isOverdue ? ' todo-item__date-badge--overdue' : ''}`}>
            {dateBadge}
          </span>
        )}
        {todo.google_calendar_event_id && (
          <span className="todo-item__gcal-badge" title="Synced to Google Calendar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
        )}
      </span>
      <button
        className="todo-item__delete"
        type="button"
        aria-label="Delete todo"
        onClick={handleDelete}
      >
        &times;
      </button>
    </div>
  );
}
