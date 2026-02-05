import { useState, useEffect } from 'react';
import { useTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';

export default function Todos() {
  const { todos, fetchTodos, addTodo, toggleTodo, deleteTodo } = useTodos();
  const [todoText, setTodoText] = useState('');
  const [todoDate, setTodoDate] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!todoText.trim()) return;
    const newTodo = await addTodo({
      text: todoText.trim(),
      date: todoDate || null,
    });
    if (newTodo) {
      setTodoText('');
      setTodoDate('');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const overdue = todos
    .filter(t => t.date !== null && !t.completed && t.date < todayStr)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const scheduled = todos
    .filter(t => t.date !== null && (t.completed || t.date >= todayStr))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.date || '').localeCompare(b.date || '');
    });

  const inbox = todos
    .filter(t => t.date === null)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h2>Your Todos</h2>
          <p className="muted">Manage scheduled and inbox tasks.</p>
        </div>
      </div>

      <section className="form-card todo-add-card">
        <form className="todo-add-form" onSubmit={handleAdd}>
          <input
            type="text"
            id="todoText"
            placeholder="What needs to be done?"
            required
            aria-required="true"
            aria-label="Todo text"
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
          />
          <input
            type="date"
            id="todoDate"
            aria-label="Optional due date"
            value={todoDate}
            onChange={(e) => setTodoDate(e.target.value)}
          />
          <button className="btn primary" type="submit">Add</button>
        </form>
      </section>

      {overdue.length > 0 && (
        <section className="todo-section todo-section--overdue">
          <h3 className="todo-section__title todo-section__title--overdue">
            Overdue ({overdue.length})
          </h3>
          <div className="todo-list" aria-live="polite">
            {overdue.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </div>
        </section>
      )}

      <section className="todo-section">
        <h3 className="todo-section__title">Scheduled</h3>
        <div className="todo-list" aria-live="polite">
          {scheduled.length === 0 ? (
            <p className="muted">No scheduled tasks.</p>
          ) : (
            scheduled.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))
          )}
        </div>
      </section>

      <section className="todo-section">
        <h3 className="todo-section__title">Inbox</h3>
        <div className="todo-list" aria-live="polite">
          {inbox.length === 0 ? (
            <p className="muted">No items in inbox.</p>
          ) : (
            inbox.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}
