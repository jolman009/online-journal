import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useOnlineStatus } from './useOnlineStatus';
import { getSyncQueue, removeFromSyncQueue, getSyncQueueCount } from '../lib/syncQueue';

export function useSyncQueue() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(getSyncQueueCount());
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(() => {
    setPendingCount(getSyncQueueCount());
  }, []);

  const processQueue = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);

    for (const item of queue) {
      try {
        let result;
        if (item.type === 'INSERT') {
          result = await supabase.from(item.table).insert(item.payload);
        } else if (item.type === 'UPDATE') {
          result = await supabase.from(item.table).update(item.payload).eq('id', item.id);
        } else if (item.type === 'DELETE') {
          result = await supabase.from(item.table).delete().eq('id', item.id);
        }

        if (result?.error) {
          console.error('Sync failed for item:', item.queueId, result.error.message);
          // Keep in queue for retry
        } else {
          removeFromSyncQueue(item.queueId);
        }
      } catch (err) {
        console.error('Sync error:', err);
        // Keep in queue for retry
        break; // Stop processing on network error
      }
    }

    syncingRef.current = false;
    setSyncing(false);
    refreshCount();
  }, [refreshCount]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      processQueue();
    }
  }, [isOnline, pendingCount, processQueue]);

  // Listen for storage changes (when other hooks add to queue)
  useEffect(() => {
    const handleStorage = () => refreshCount();
    window.addEventListener('storage', handleStorage);
    // Also poll periodically since same-tab storage events don't fire
    const interval = setInterval(refreshCount, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [refreshCount]);

  return { pendingCount, syncing, refreshCount };
}
