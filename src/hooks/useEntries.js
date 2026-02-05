import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
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
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('entries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntries(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEntries(prev =>
              prev.map(e => (e.id === payload.new.id ? payload.new : e))
            );
          } else if (payload.eventType === 'DELETE') {
            setEntries(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        tags: entry.tags || [],
        pinned: false,
      });

    if (error) {
      console.error('Failed to save entry:', error.message);
      alert('Failed to save entry. Please try again.');
      return false;
    }
    // Real-time will handle the state update
    return true;
  };

  const updateEntry = async (id, fields) => {
    const updateData = {
      title: fields.title,
      date: fields.date,
      content: fields.content,
    };
    if (fields.tags !== undefined) {
      updateData.tags = fields.tags;
    }

    const { error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update entry:', error.message);
      alert('Failed to update entry. Please try again.');
      return false;
    }
    // Real-time will handle the state update
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
    // Real-time will handle the state update
    return true;
  };

  const togglePin = async (id, currentPinned) => {
    const { error } = await supabase
      .from('journal_entries')
      .update({ pinned: !currentPinned })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle pin:', error.message);
      return false;
    }
    // Real-time will handle the state update
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
    togglePin,
  };
}
