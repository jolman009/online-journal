import { Link } from 'react-router-dom';

export default function TodosWidget({ todos }) {
  const pending = todos.filter(t => !t.completed);
  const preview = pending.slice(0, 5);

  return (
    <div className="calendar-widget todo-widget">
      <div className="todo-widget__header">
        <h3 className="todo-widget__title">Pending Tasks</h3>
        <span className="todo-widget__count">{pending.length}</span>
        <Link to="/todos" className="todo-widget__link">View all</Link>
      </div>
      {preview.length === 0 ? (
        <p className="muted">All caught up!</p>
      ) : (
        <div className="todo-widget__list">
          {preview.map(todo => {
            const dateBadge = todo.date
              ? new Date(todo.date + 'T00:00:00Z').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })
              : null;

            return (
              <div key={todo.id} className="todo-widget__item">
                <span className="todo-widget__dot" />
                <span className="todo-widget__text">{todo.text}</span>
                {dateBadge && (
                  <span className="todo-item__date-badge">{dateBadge}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
