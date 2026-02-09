import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useTodos } from '../hooks/useTodos';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import TodoItem from '../components/TodoItem';
import SortableTodoItem from '../components/SortableTodoItem';
import TagInput from '../components/TagInput';
import TagFilter from '../components/TagFilter';
import PullToRefresh from '../components/PullToRefresh';
import GoogleCalendarConnect from '../components/GoogleCalendarConnect';
import { exportTodos } from '../utils/export';

export default function Todos() {
  const { todos, fetchTodos, addTodo, toggleTodo, deleteTodo, updateSortOrder } = useTodos();
  const {
    isConnected: gcalConnected,
    syncing: gcalSyncing,
    connect: gcalConnect,
    disconnect: gcalDisconnect,
    syncTodoToCalendar,
    deleteTodoFromCalendar,
    syncAllTodos,
  } = useGoogleCalendar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [todoText, setTodoText] = useState('');
  const [todoDate, setTodoDate] = useState('');
  const [todoTags, setTodoTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const initialSyncDone = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTodos();
  }, []);

  // Handle ?google=connected → refresh session + trigger initial sync
  useEffect(() => {
    if (searchParams.get('google') === 'connected' && !initialSyncDone.current) {
      initialSyncDone.current = true;
      setSearchParams({}, { replace: true });
      // Refresh session to pick up new user_metadata.google_calendar_connected
      supabase.auth.refreshSession().then(() => {
        // Wait for todos to load then sync all
        const timer = setTimeout(() => {
          if (todos.length > 0) syncAllTodos(todos);
        }, 500);
        return () => clearTimeout(timer);
      });
    }
    if (searchParams.get('connectGcal') === '1') {
      setSearchParams({}, { replace: true });
      gcalConnect();
    }
  }, [searchParams]);

  const handleRefresh = useCallback(async () => {
    await fetchTodos();
  }, [fetchTodos]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!todoText.trim()) return;
    const newTodo = await addTodo({
      text: todoText.trim(),
      date: todoDate || null,
      tags: todoTags,
    });
    if (newTodo) {
      setTodoText('');
      setTodoDate('');
      setTodoTags([]);
      // Non-blocking calendar sync, then refresh to show badge
      if (newTodo.date && gcalConnected) {
        syncTodoToCalendar(newTodo).then(() => fetchTodos());
      }
    }
  };

  const handleToggle = async (id, completed) => {
    const success = await toggleTodo(id, completed);
    if (success && gcalConnected) {
      const todo = todos.find(t => t.id === id);
      if (todo?.date) {
        syncTodoToCalendar({ ...todo, completed }).then(() => fetchTodos());
      }
    }
    return success;
  };

  const handleDelete = async (id) => {
    const todo = todos.find(t => t.id === id);
    const success = await deleteTodo(id);
    if (success && gcalConnected && todo) {
      deleteTodoFromCalendar(todo);
    }
    return success;
  };

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    todos.forEach(t => (t.tags || []).forEach(tag => tagSet.add(tag)));
    return [...tagSet].sort();
  }, [todos]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filterByTags = (items) => {
    if (selectedTags.length === 0) return items;
    return items.filter(t =>
      selectedTags.every(tag => (t.tags || []).includes(tag))
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const overdue = filterByTags(
    todos
      .filter(t => t.date !== null && !t.completed && t.date < todayStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  );

  const scheduled = filterByTags(
    todos
      .filter(t => t.date !== null && (t.completed || t.date >= todayStr))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.date || '').localeCompare(b.date || '');
      })
  );

  const inbox = filterByTags(
    todos
      .filter(t => t.date === null)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = inbox.findIndex(t => t.id === active.id);
      const newIndex = inbox.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(inbox, oldIndex, newIndex);
        // Update sort_order for reordered items
        const withNewOrder = reordered.map((todo, index) => ({
          ...todo,
          sort_order: index,
        }));
        updateSortOrder(withNewOrder);
      }
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h2>Your Todos</h2>
          <p className="muted">Manage scheduled and inbox tasks. Drag to reorder inbox items.</p>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => exportTodos(todos)}
          disabled={todos.length === 0}
        >
          Export JSON
        </button>
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
        <div className="todo-add-tags">
          <TagInput tags={todoTags} onChange={setTodoTags} placeholder="Add tags..." />
        </div>
      </section>

      <GoogleCalendarConnect
        isConnected={gcalConnected}
        syncing={gcalSyncing}
        onConnect={gcalConnect}
        onDisconnect={gcalDisconnect}
      />

      <TagFilter
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggle={handleTagToggle}
        onClear={() => setSelectedTags([])}
      />

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
                onToggle={handleToggle}
                onDelete={handleDelete}
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
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </section>

      <section className="todo-section">
        <h3 className="todo-section__title">
          Inbox
          {inbox.length > 1 && <span className="todo-section__hint"> (drag to reorder)</span>}
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={inbox.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="todo-list todo-list--sortable" aria-live="polite">
              {inbox.length === 0 ? (
                <p className="muted">No items in inbox.</p>
              ) : (
                inbox.map(todo => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </PullToRefresh>
  );
}
