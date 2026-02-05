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
        {dateBadge && (
          <span className={`todo-item__date-badge${isOverdue ? ' todo-item__date-badge--overdue' : ''}`}>
            {dateBadge}
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
