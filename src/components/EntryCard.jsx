import { useState } from 'react';
import { Link } from 'react-router-dom';
import { renderMarkdown } from '../utils/markdown';

export default function EntryCard({ entry, onDelete, onTogglePin }) {
  const [confirming, setConfirming] = useState(false);

  const dateObj = new Date(`${entry.date}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const handleDelete = async () => {
    const success = await onDelete(entry.id);
    if (!success) {
      setConfirming(false);
    }
  };

  return (
    <article className="entry-card">
      <div className="entry-card__header">
        {entry.pinned && <span className="entry-card__pin-icon" aria-label="Pinned">&#128204;</span>}
        <h3>{entry.title}</h3>
      </div>
      <time>{formattedDate}</time>
      <div
        className="entry-card__content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.content) }}
      />
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
                onClick={() => onTogglePin(entry.id, entry.pinned)}
                aria-label={entry.pinned ? 'Unpin entry' : 'Pin entry'}
              >
                {entry.pinned ? 'Unpin' : 'Pin'}
              </button>
            )}
            <Link className="entry-card__btn" to={`/new-entry?id=${entry.id}`}>
              Edit
            </Link>
            <button
              className="entry-card__btn entry-card__btn--delete"
              type="button"
              onClick={() => setConfirming(true)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
