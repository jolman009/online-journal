import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { encryptData, decryptData } from '../lib/crypto';
import { addToSyncQueue } from '../lib/syncQueue';

export function useEntries() {
  const { user, encryptionKey } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const encryptionKeyRef = useRef(encryptionKey);
  useEffect(() => {
    encryptionKeyRef.current = encryptionKey;
  }, [encryptionKey]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const currentKey = encryptionKeyRef.current;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, user_id, date, pinned, created_at, encrypted_payload')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch journal entries:', error.message);
        // Keep current in-memory state on error
      } else {
        const decryptedEntries = await Promise.all(
          (data || []).map(async (entry) => {
            if (entry.encrypted_payload && currentKey) {
              try {
                const decrypted = await decryptData(JSON.parse(entry.encrypted_payload), currentKey);
                return { ...entry, ...decrypted, encrypted_payload: undefined, isDecrypted: true };
              } catch (decryptionError) {
                console.error('Decryption failed for entry:', entry.id, decryptionError);
                const errorMessage = decryptionError.message.includes('Failed to decrypt data')
                  ? 'Failed to decrypt entry. Possible incorrect master password or tampered data.'
                  : decryptionError.message;
                return {
                  ...entry,
                  content: '[Decryption Failed]',
                  title: '[Encrypted]',
                  tags: [],
                  encrypted_payload: undefined,
                  isDecrypted: false,
                  decryptionError: errorMessage,
                };
              }
            }
            return { ...entry, isDecrypted: !entry.encrypted_payload };
          })
        );
        setEntries(decryptedEntries);
      }
    } catch (err) {
      console.error('Network error fetching entries:', err);
      // Keep current in-memory state
    }

    setLoading(false);
    return entries;
  }, []);

  // Refetch entries when encryption key becomes available
  useEffect(() => {
    if (encryptionKey) {
      fetchEntries();
    }
  }, [encryptionKey, fetchEntries]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('entries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        async (payload) => {
          const currentKey = encryptionKeyRef.current;
          let processedEntry = payload.new;
          if (processedEntry && processedEntry.encrypted_payload && currentKey) {
            try {
              const decrypted = await decryptData(JSON.parse(processedEntry.encrypted_payload), currentKey);
              processedEntry = { ...processedEntry, ...decrypted, encrypted_payload: undefined, isDecrypted: true };
            } catch (decryptionError) {
              console.error('Real-time decryption failed for entry:', processedEntry.id, decryptionError);
              const errorMessage = decryptionError.message.includes('Failed to decrypt data')
                ? 'Failed to decrypt entry. Possible incorrect master password or tampered data.'
                : decryptionError.message;
              processedEntry = {
                ...processedEntry,
                content: '[Decryption Failed]',
                title: '[Encrypted]',
                tags: [],
                encrypted_payload: undefined,
                isDecrypted: false,
                decryptionError: errorMessage,
              };
            }
          } else if (processedEntry) {
            processedEntry = { ...processedEntry, isDecrypted: !processedEntry.encrypted_payload };
          }

          if (payload.eventType === 'INSERT') {
            setEntries(prev => {
              if (prev.some(e => e.id === payload.new.id)) {
                return prev.map(e => e.id === payload.new.id ? processedEntry : e);
              }
              return [processedEntry, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setEntries(prev =>
              prev.map(e => (e.id === payload.new.id ? processedEntry : e))
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

  const getEntryById = useCallback(async (id) => {
    const currentKey = encryptionKeyRef.current;

    // Check in-memory first (useful offline)
    const cached = entries.find(e => e.id === id);
    if (cached && cached.isDecrypted) return cached;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, user_id, date, pinned, created_at, encrypted_payload')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch entry:', error.message);
        return cached || null;
      }

      if (data && data.encrypted_payload && currentKey) {
        try {
          const decrypted = await decryptData(JSON.parse(data.encrypted_payload), currentKey);
          return { ...data, ...decrypted, encrypted_payload: undefined, isDecrypted: true };
        } catch (decryptionError) {
          console.error('Decryption failed for entry:', data.id, decryptionError);
          const errorMessage = decryptionError.message.includes('Failed to decrypt data')
            ? 'Failed to decrypt entry. Possible incorrect master password or tampered data.'
            : decryptionError.message;
          return {
            ...data,
            content: '[Decryption Failed]',
            title: '[Encrypted]',
            tags: [],
            encrypted_payload: undefined,
            isDecrypted: false,
            decryptionError: errorMessage,
          };
        }
      }
      return { ...data, isDecrypted: !data.encrypted_payload };
    } catch (err) {
      console.error('Network error fetching entry:', err);
      return cached || null;
    }
  }, [entries]);

  const addEntry = useCallback(async (entry) => {
    const currentKey = encryptionKeyRef.current;
    if (!user) return false;
    if (!currentKey) {
      alert('E2E encryption is not unlocked. Cannot save encrypted entry.');
      return false;
    }

    const sensitiveData = {
      title: entry.title,
      content: entry.content,
      tags: entry.tags || [],
      mood: entry.mood || null,
      voiceNotes: entry.voiceNotes || [],
    };

    const { ciphertext, nonce } = await encryptData(sensitiveData, currentKey);
    const encryptedPayload = JSON.stringify({ ciphertext, nonce });

    const insertPayload = {
      user_id: user.id,
      date: entry.date,
      pinned: entry.pinned || false,
      encrypted_payload: encryptedPayload,
    };

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const optimistic = {
        ...insertPayload,
        id: tempId,
        created_at: new Date().toISOString(),
        ...sensitiveData,
        encrypted_payload: undefined,
        isDecrypted: true,
        _pending: true,
      };
      setEntries(prev => [optimistic, ...prev]);
      addToSyncQueue({ type: 'INSERT', table: 'journal_entries', payload: insertPayload });
      return true;
    }

    const { error } = await supabase
      .from('journal_entries')
      .insert(insertPayload);

    if (error) {
      console.error('Failed to save entry:', error.message);
      alert('Failed to save entry. Please try again.');
      return false;
    }
    return true;
  }, [user]);

  const updateEntry = useCallback(async (id, fields) => {
    const currentKey = encryptionKeyRef.current;
    if (!currentKey) {
      alert('E2E encryption is not unlocked. Cannot update encrypted entry.');
      return false;
    }

    const sensitiveData = {};
    if (fields.title !== undefined) sensitiveData.title = fields.title;
    if (fields.content !== undefined) sensitiveData.content = fields.content;
    if (fields.tags !== undefined) sensitiveData.tags = fields.tags;
    if (fields.mood !== undefined) sensitiveData.mood = fields.mood;
    if (fields.voiceNotes !== undefined) sensitiveData.voiceNotes = fields.voiceNotes;

    const { ciphertext, nonce } = await encryptData(sensitiveData, currentKey);

    const updateData = {
      encrypted_payload: JSON.stringify({ ciphertext, nonce }),
    };

    if (fields.date !== undefined) updateData.date = fields.date;
    if (fields.pinned !== undefined) updateData.pinned = fields.pinned;

    if (!navigator.onLine) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, ...fields, _pending: true } : e));
      addToSyncQueue({ type: 'UPDATE', table: 'journal_entries', payload: updateData, id });
      return true;
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
    return true;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    if (!navigator.onLine) {
      setEntries(prev => prev.filter(e => e.id !== id));
      addToSyncQueue({ type: 'DELETE', table: 'journal_entries', id });
      return true;
    }

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete entry:', error.message);
      return false;
    }
    return true;
  }, []);

  const togglePin = useCallback(async (id, currentPinned) => {
    if (!navigator.onLine) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, pinned: !currentPinned, _pending: true } : e));
      addToSyncQueue({ type: 'UPDATE', table: 'journal_entries', payload: { pinned: !currentPinned }, id });
      return true;
    }

    const { error } = await supabase
      .from('journal_entries')
      .update({ pinned: !currentPinned })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle pin:', error.message);
      return false;
    }
    return true;
  }, []);

  const quickAddEntry = useCallback(async (content, mood = null) => {
    const currentKey = encryptionKeyRef.current;
    if (!user) return false;
    if (!currentKey) {
      alert('E2E encryption is not unlocked. Cannot save encrypted entry.');
      return false;
    }

    const firstLine = content.split('\n')[0].trim();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const formattedDate = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    let title = firstLine.slice(0, 50);
    if (!title || title.length < 3) {
      title = `Quick note - ${formattedDate}`;
    } else if (firstLine.length > 50) {
      title = title + '...';
    }

    return addEntry({
      title,
      date: dateStr,
      content,
      tags: [],
      mood,
      voiceNotes: [],
    });
  }, [user, addEntry]);

  return {
    entries,
    loading,
    fetchEntries,
    getEntryById,
    addEntry,
    updateEntry,
    deleteEntry,
    togglePin,
    quickAddEntry,
  };
}
