const QUEUE_KEY = 'jotflow_sync_queue';

export function getSyncQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToSyncQueue({ type, table, payload, id }) {
  const queue = getSyncQueue();
  queue.push({
    queueId: crypto.randomUUID(),
    type,
    table,
    payload,
    id,
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromSyncQueue(queueId) {
  const queue = getSyncQueue().filter((item) => item.queueId !== queueId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearSyncQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function getSyncQueueCount() {
  return getSyncQueue().length;
}
