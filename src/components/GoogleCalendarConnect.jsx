import { useState } from 'react';

export default function GoogleCalendarConnect({ isConnected, syncing, onConnect, onDisconnect }) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await onDisconnect();
    setDisconnecting(false);
  };

  return (
    <div className="form-card gcal-card">
      <div className="gcal-card__content">
        <div className="gcal-card__info">
          <span className="gcal-card__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div>
            <strong className="gcal-card__title">Google Calendar</strong>
            <span className="gcal-card__status">
              {isConnected
                ? syncing ? 'Syncing...' : 'Connected'
                : 'Sync dated todos as calendar events'}
            </span>
          </div>
        </div>
        {isConnected ? (
          <button
            type="button"
            className="btn ghost btn--sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <button
            type="button"
            className="btn primary btn--sm"
            onClick={onConnect}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
