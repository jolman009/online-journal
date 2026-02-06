import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { addToSyncQueue } from '../lib/syncQueue';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch todos:', error.message);
        // Keep current state on network error so offline still shows data
      } else {
        setTodos(data || []);
      }
    } catch (err) {
      console.error('Network error fetching todos:', err);
      // Keep current in-memory state
    }
    setLoading(false);
    return todos;
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('todos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Don't duplicate if we already have it (optimistic add)
            setTodos(prev => {
              if (prev.some(t => t.id === payload.new.id)) {
                return prev.map(t => t.id === payload.new.id ? payload.new : t);
              }
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTodos(prev =>
              prev.map(t => (t.id === payload.new.id ? payload.new : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTodos(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTodo = async (todo) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const maxSortOrder = todos.reduce((max, t) => Math.max(max, t.sort_order || 0), 0);

    const payload = {
      user_id: user.id,
      text: todo.text,
      date: todo.date || null,
      tags: todo.tags || [],
      completed: false,
      sort_order: maxSortOrder + 1,
    };

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const optimistic = { ...payload, id: tempId, created_at: new Date().toISOString(), _pending: true };
      setTodos(prev => [optimistic, ...prev]);
      addToSyncQueue({ type: 'INSERT', table: 'todos', payload });
      return optimistic;
    }

    const { data, error } = await supabase
      .from('todos')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to add todo:', error.message);
      return null;
    }
    return data;
  };

  const toggleTodo = async (id, completed) => {
    if (!navigator.onLine) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed, _pending: true } : t));
      addToSyncQueue({ type: 'UPDATE', table: 'todos', payload: { completed }, id });
      return true;
    }

    const { error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle todo:', error.message);
      return false;
    }
    return true;
  };

  const deleteTodo = async (id) => {
    if (!navigator.onLine) {
      setTodos(prev => prev.filter(t => t.id !== id));
      addToSyncQueue({ type: 'DELETE', table: 'todos', id });
      return true;
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete todo:', error.message);
      return false;
    }
    return true;
  };

  const updateSortOrder = async (reorderedTodos) => {
    // Optimistically update local state
    setTodos(prev => {
      const reorderedIds = new Set(reorderedTodos.map(t => t.id));
      const unchanged = prev.filter(t => !reorderedIds.has(t.id));
      return [...reorderedTodos, ...unchanged];
    });

    if (!navigator.onLine) {
      // Queue each sort order update
      reorderedTodos.forEach((todo, index) => {
        addToSyncQueue({ type: 'UPDATE', table: 'todos', payload: { sort_order: index }, id: todo.id });
      });
      return true;
    }

    const updates = reorderedTodos.map((todo, index) =>
      supabase
        .from('todos')
        .update({ sort_order: index })
        .eq('id', todo.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      console.error('Failed to update sort order');
      fetchTodos();
      return false;
    }
    return true;
  };

  return {
    todos,
    setTodos,
    loading,
    fetchTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateSortOrder,
  };
}
