import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const GCAL_QUEUE_KEY = 'jotflow_gcal_sync_queue';

function getGcalQueue() {
  try {
    return JSON.parse(localStorage.getItem(GCAL_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function addToGcalQueue(op) {
  const queue = getGcalQueue();
  queue.push({ ...op, queueId: crypto.randomUUID(), timestamp: Date.now() });
  localStorage.setItem(GCAL_QUEUE_KEY, JSON.stringify(queue));
}

function removeFromGcalQueue(queueId) {
  const queue = getGcalQueue().filter(item => item.queueId !== queueId);
  localStorage.setItem(GCAL_QUEUE_KEY, JSON.stringify(queue));
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const debounceTimers = useRef(new Map());
  const isConnected = !!user?.user_metadata?.google_calendar_connected;

  // Replay queued ops when coming online
  useEffect(() => {
    if (!isConnected) return;

    const handleOnline = async () => {
      const queue = getGcalQueue();
      if (queue.length === 0) return;

      for (const op of queue) {
        try {
          const { error } = await supabase.functions.invoke('google-calendar-sync', {
            body: { action: op.action, todo: op.todo },
          });
          if (!error) {
            removeFromGcalQueue(op.queueId);
          }
        } catch {
          // Keep in queue for next retry
        }
      }
    };

    window.addEventListener('online', handleOnline);
    // Also replay immediately if already online and queue has items
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener('online', handleOnline);
  }, [isConnected]);

  const connect = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth-url');
      if (error) {
        console.error('Failed to get Google auth URL:', error);
        return;
      }
      // data may already be parsed or may be a string
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed?.url) {
        window.location.href = parsed.url;
      } else {
        console.error('No URL in response:', parsed);
      }
    } catch (err) {
      console.error('Google connect error:', err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const { error } = await supabase.functions.invoke('google-disconnect');
    if (error) {
      console.error('Failed to disconnect Google:', error);
      return false;
    }
    // Force refresh user metadata
    await supabase.auth.refreshSession();
    return true;
  }, []);

  const syncTodoToCalendar = useCallback(async (todo) => {
    if (!isConnected || !todo.date) return;

    // Debounce rapid updates per todo
    const existing = debounceTimers.current.get(todo.id);
    if (existing) clearTimeout(existing);

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        debounceTimers.current.delete(todo.id);

        if (!navigator.onLine) {
          addToGcalQueue({ action: 'upsert', todo });
          resolve(null);
          return;
        }

        try {
          const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
            body: { action: 'upsert', todo },
          });

          if (error) {
            // Try to read the response body for details
            try {
              const body = await error.context?.json?.() || error.message;
              console.error('Calendar sync failed:', body);
            } catch {
              console.error('Calendar sync failed:', error);
            }
            resolve(null);
            return;
          }

          if (data?.error === 'google_disconnected') {
            await supabase.auth.refreshSession();
            resolve(null);
            return;
          }

          resolve(data?.eventId || null);
        } catch (err) {
          console.error('Calendar sync error:', err);
          addToGcalQueue({ action: 'upsert', todo });
          resolve(null);
        }
      }, 300);

      debounceTimers.current.set(todo.id, timer);
    });
  }, [isConnected]);

  const deleteTodoFromCalendar = useCallback(async (todo) => {
    if (!isConnected || !todo.google_calendar_event_id) return;

    if (!navigator.onLine) {
      addToGcalQueue({ action: 'delete', todo });
      return;
    }

    try {
      const { data } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'delete', todo },
      });
      if (data?.error === 'google_disconnected') {
        await supabase.auth.refreshSession();
      }
    } catch (err) {
      console.error('Calendar delete error:', err);
      addToGcalQueue({ action: 'delete', todo });
    }
  }, [isConnected]);

  const syncAllTodos = useCallback(async (todos) => {
    if (!isConnected) return;

    setSyncing(true);
    const dated = todos.filter(t => t.date && !t._pending);

    for (const todo of dated) {
      if (!navigator.onLine) {
        addToGcalQueue({ action: 'upsert', todo });
        continue;
      }

      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: { action: 'upsert', todo },
        });
      } catch {
        addToGcalQueue({ action: 'upsert', todo });
      }
    }
    setSyncing(false);
  }, [isConnected]);

  return {
    isConnected,
    syncing,
    connect,
    disconnect,
    syncTodoToCalendar,
    deleteTodoFromCalendar,
    syncAllTodos,
  };
}
