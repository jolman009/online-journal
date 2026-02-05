import { useState } from 'react';
import { Link } from 'react-router-dom';
import { renderMarkdown } from '../utils/markdown';
import { useHapticFeedback } from '../hooks/useHapticFeedback'; // Import useHapticFeedback

const MOOD_EMOJIS = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export default function EntryCard({ entry, onDelete, onTogglePin }) {
  const [confirming, setConfirming] = useState(false);
  const triggerHaptic = useHapticFeedback(); // Initialize haptic feedback hook

  const dateObj = new Date(`${entry.date}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const handleDelete = async () => {
    const success = await onDelete(entry.id);
    if (success) {
      triggerHaptic(); // Trigger haptic feedback on successful delete
    } else {
      setConfirming(false);
    }
  };

  const handleTogglePin = async () => {
    if (onTogglePin) {
      await onTogglePin(entry.id, entry.pinned);
      triggerHaptic(); // Trigger haptic feedback on successful toggle
    }
  };

  return (
    <article className="entry-card">
      <div className="entry-card__header">
        {entry.pinned && <span className="entry-card__pin-icon" aria-label="Pinned">&#128204;</span>}
        <h3>{entry.isDecrypted === false ? 'Encrypted Entry' : entry.title}</h3>
      </div>
      <div className="entry-card__meta">
        <time>{formattedDate}</time>
        {entry.mood && entry.isDecrypted !== false && (
          <span className="entry-card__mood" title={`Mood: ${entry.mood}/5`}>
            {MOOD_EMOJIS[entry.mood]}
          </span>
        )}
        {entry.voiceNotes && entry.voiceNotes.length > 0 && entry.isDecrypted !== false && (
          <span className="entry-card__voice-badge" title={`${entry.voiceNotes.length} voice note(s)`}>
            🎤 {entry.voiceNotes.length}
          </span>
        )}
      </div>
      {entry.tags && entry.tags.length > 0 && entry.isDecrypted !== false && (
        <div className="entry-card__tags">
          {entry.tags.map(tag => (
            <span key={tag} className="entry-card__tag">{tag}</span>
          ))}
        </div>
      )}
      {entry.isDecrypted === false ? (
        <div className="entry-card__content decryption-error">
          <p className="danger-text">{entry.decryptionError || 'This entry could not be decrypted.'}</p>
          <p className="muted">Please ensure your master password is correct or check the console for more details.</p>
        </div>
      ) : (
        <div
          className="entry-card__content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.content) }}
        />
      )}
      <div className="entry-card__actions">
        {confirming ? (
          <>
            <span className="entry-card__confirm-msg">Delete this entry?</span>
            <button
              className="entry-card__btn entry-card__btn--confirm"
              type="button"
              onClick={handleDelete}
            >
              Yes, delete
            </button>
            <button
              className="entry-card__btn"
              type="button"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {onTogglePin && (
              <button
                className={`entry-card__btn entry-card__btn--pin${entry.pinned ? ' entry-card__btn--pinned' : ''}`}
                type="button"
                onClick={handleTogglePin}
                aria-label={entry.pinned ? 'Unpin entry' : 'Pin entry'}
                disabled={entry.isDecrypted === false} // Disable if not decrypted
              >
                {entry.pinned ? 'Unpin' : 'Pin'}
              </button>
            )}
            <Link className="entry-card__btn" to={`/new-entry?id=${entry.id}`}
                  aria-disabled={entry.isDecrypted === false ? 'true' : undefined}
                  onClick={(e) => entry.isDecrypted === false && e.preventDefault()}
                  style={entry.isDecrypted === false ? { pointerEvents: 'none', opacity: 0.6 } : {}}
            >
              Edit
            </Link>
            <button
              className="entry-card__btn entry-card__btn--delete"
              type="button"
              onClick={() => setConfirming(true)}
              disabled={entry.isDecrypted === false} // Disable if not decrypted
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
