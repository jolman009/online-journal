import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function TodosMiniWidget({ config, todos }) {
  const limit = config.limit || 5;

  const displayTodos = useMemo(() => {
    const pending = todos.filter(t => !t.completed);
    return pending.slice(0, limit);
  }, [todos, limit]);

  const pendingCount = todos.filter(t => !t.completed).length;

  return (
    <div className="todos-mini-widget">
      {displayTodos.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          No pending todos. Nice work!
        </p>
      ) : (
        <ul className="todos-mini-widget__list">
          {displayTodos.map(todo => (
            <li key={todo.id} className="todos-mini-widget__item">
              <span className="todos-mini-widget__check" />
              <span>{todo.text}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="todos-mini-widget__footer">
        <Link to="/todos">
          {pendingCount > limit
            ? `+ ${pendingCount - limit} more — View all`
            : 'View all todos'}
        </Link>
      </div>
    </div>
  );
}
