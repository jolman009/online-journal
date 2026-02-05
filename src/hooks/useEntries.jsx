import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { encryptData, decryptData } from '../lib/crypto'; // Import crypto utilities

export function useEntries() {
  const { user, encryptionKey } = useAuth(); // Access user and encryptionKey from AuthContext
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    // Fetch only non-sensitive data and encrypted_payload
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, user_id, date, pinned, created_at, updated_at, encrypted_payload') // Select encrypted_payload
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch journal entries:', error.message);
      setEntries([]);
    } else {
      // Decrypt entries if key is available
      const decryptedEntries = await Promise.all(
        (data || []).map(async (entry) => {
          if (entry.encrypted_payload && encryptionKey) {
            try {
              const decrypted = await decryptData(JSON.parse(entry.encrypted_payload), encryptionKey);
              return { ...entry, ...decrypted, encrypted_payload: undefined, isDecrypted: true }; // Merge decrypted data
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
          return { ...entry, isDecrypted: !entry.encrypted_payload }; // If no encrypted_payload, it's not encrypted
        })
      );
      setEntries(decryptedEntries);
    }
    setLoading(false);
    return decryptedEntries || []; // Return decrypted entries
  }, [encryptionKey]); // Depend on encryptionKey for re-fetching/re-decrypting


  // Real-time subscription - will need to decrypt payload for new/updated entries
  useEffect(() => {
    const channel = supabase
      .channel('entries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        async (payload) => { // Make async to allow decryption
          let processedEntry = payload.new;
          if (processedEntry && processedEntry.encrypted_payload && encryptionKey) {
            try {
              const decrypted = await decryptData(JSON.parse(processedEntry.encrypted_payload), encryptionKey);
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
            setEntries(prev => [processedEntry, ...prev]);
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
  }, [encryptionKey]); // Depend on encryptionKey for real-time decryption


  const getEntryById = async (id) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, user_id, date, pinned, created_at, updated_at, encrypted_payload') // Select encrypted_payload
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch entry:', error.message);
      return null;
    }

    if (data && data.encrypted_payload && encryptionKey) {
      try {
        const decrypted = await decryptData(JSON.parse(data.encrypted_payload), encryptionKey);
        return { ...data, ...decrypted, encrypted_payload: undefined, isDecrypted: true }; // Merge decrypted data
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
      }; // This closing brace was missing, corrected here.
    
      const addEntry = async (entry) => {
        if (!user) return false;
        if (!encryptionKey) {
          alert('E2E encryption is not unlocked. Cannot save encrypted entry.');
          return false;
        }
    
        const sensitiveData = {
          title: entry.title,
          content: entry.content,
          tags: entry.tags || [],
          mood: entry.mood || null,
        };
    
        const { ciphertext, nonce } = await encryptData(sensitiveData, encryptionKey);
    
        const { error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            date: entry.date,
            pinned: entry.pinned || false, // Ensure pinned is passed
            encrypted_payload: JSON.stringify({ ciphertext, nonce }), // Store encrypted payload
            // Do NOT store title, content, tags directly
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
        if (!encryptionKey) {
          alert('E2E encryption is not unlocked. Cannot update encrypted entry.');
          return false;
        }
    
        const sensitiveData = {};
        if (fields.title !== undefined) sensitiveData.title = fields.title;
        if (fields.content !== undefined) sensitiveData.content = fields.content;
        if (fields.tags !== undefined) sensitiveData.tags = fields.tags;
        if (fields.mood !== undefined) sensitiveData.mood = fields.mood;
    
        const { ciphertext, nonce } = await encryptData(sensitiveData, encryptionKey);
    
        const updateData = {
          encrypted_payload: JSON.stringify({ ciphertext, nonce }),
        };
    
        if (fields.date !== undefined) updateData.date = fields.date;
        if (fields.pinned !== undefined) updateData.pinned = fields.pinned; // Allow updating pinned state
    
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