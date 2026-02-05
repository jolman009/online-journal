import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch todos:', error.message);
      setTodos([]);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
    return data || [];
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
            setTodos(prev => [payload.new, ...prev]);
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

    // Get the highest sort_order and add 1
    const maxSortOrder = todos.reduce((max, t) => Math.max(max, t.sort_order || 0), 0);

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        text: todo.text,
        date: todo.date || null,
        tags: todo.tags || [],
        completed: false,
        sort_order: maxSortOrder + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add todo:', error.message);
      return null;
    }
    // Real-time will handle the state update
    return data;
  };

  const toggleTodo = async (id, completed) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle todo:', error.message);
      return false;
    }
    // Real-time will handle the state update
    return true;
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete todo:', error.message);
      return false;
    }
    // Real-time will handle the state update
    return true;
  };

  const updateSortOrder = async (reorderedTodos) => {
    // Optimistically update local state
    setTodos(prev => {
      const reorderedIds = new Set(reorderedTodos.map(t => t.id));
      const unchanged = prev.filter(t => !reorderedIds.has(t.id));
      return [...reorderedTodos, ...unchanged];
    });

    // Update each todo's sort_order in the database
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
      // Refetch to restore correct order
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
