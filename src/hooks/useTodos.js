import { useState } from 'react';
import { supabase } from '../supabase';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch todos:', error.message);
      setTodos([]);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
    return data || [];
  };

  const addTodo = async (todo) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        text: todo.text,
        date: todo.date || null,
        tags: todo.tags || [],
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add todo:', error.message);
      return null;
    }
    setTodos(prev => [data, ...prev]);
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
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed } : t))
    );
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
    setTodos(prev => prev.filter(t => t.id !== id));
    return true;
  };

  return { todos, loading, fetchTodos, addTodo, toggleTodo, deleteTodo };
}
