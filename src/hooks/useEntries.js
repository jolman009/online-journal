import { useState } from 'react';
import { supabase } from '../supabase';

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch journal entries:', error.message);
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
    return data || [];
  };

  const getEntryById = async (id) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch entry:', error.message);
      return null;
    }
    return data;
  };

  const addEntry = async (entry) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: entry.title,
        date: entry.date,
        content: entry.content,
      });

    if (error) {
      console.error('Failed to save entry:', error.message);
      alert('Failed to save entry. Please try again.');
      return false;
    }
    return true;
  };

  const updateEntry = async (id, fields) => {
    const { error } = await supabase
      .from('journal_entries')
      .update({
        title: fields.title,
        date: fields.date,
        content: fields.content,
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update entry:', error.message);
      alert('Failed to update entry. Please try again.');
      return false;
    }
    return true;
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete entry:', error.message);
      return false;
    }
    setEntries(prev => prev.filter(e => e.id !== id));
    return true;
  };

  return {
    entries,
    loading,
    fetchEntries,
    getEntryById,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
