import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncing } = useSyncQueue();

  if (isOnline && !syncing && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div className="offline-banner" role="status">
        <span className="offline-banner__dot" />
        <span>You are offline. Changes will sync when reconnected.</span>
        {pendingCount > 0 && (
          <span className="sync-pending-badge">{pendingCount} pending</span>
        )}
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="offline-banner offline-banner--syncing" role="status">
        <span className="offline-banner__dot offline-banner__dot--syncing" />
        <span>Syncing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}...</span>
      </div>
    );
  }

  return null;
}
