import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntries } from '../hooks/useEntries';
import { useStreak } from '../hooks/useStreak';

export default function Home() {
  const { user } = useAuth();
  const { entries, fetchEntries } = useEntries();
  const { currentStreak, longestStreak, totalEntries } = useStreak(entries);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  return (
    <>
      {user && (
        <section className="home-stats">
          <div className="review-stats">
            <div className="review-stat">
              <span className="review-stat__value">{currentStreak}</span>
              <span className="review-stat__label">Current Streak</span>
            </div>
            <div className="review-stat">
              <span className="review-stat__value">{longestStreak}</span>
              <span className="review-stat__label">Longest Streak</span>
            </div>
            <div className="review-stat">
              <span className="review-stat__value">{totalEntries}</span>
              <span className="review-stat__label">Total Entries</span>
            </div>
          </div>
        </section>
      )}

      <section className="hero">
        <div className="hero__text">
          <p className="eyebrow">Synced across devices</p>
          <h2>Write with clarity. Access from anywhere.</h2>
          <p>
            Capture moments, ideas, and reflections in a focused space.
            Entries sync securely to the cloud so you can write from any device.
          </p>
          <div className="hero__actions">
            <Link className="btn primary" to="/new-entry">Start a new entry</Link>
            <Link className="btn ghost" to="/journal">Browse journal</Link>
          </div>
          <div className="meta">
            <span className="meta__pill">Cloud-synced</span>
            <span className="meta__pill">Cross-device</span>
            <span className="meta__pill">Secure</span>
          </div>
        </div>
        <div className="hero__card">
          <div className="hero__card-header">
            <span className="dot red"></span>
            <span className="dot amber"></span>
            <span className="dot green"></span>
            <span className="card-label">Preview</span>
          </div>
          <div className="hero__card-body">
            <p className="muted">Today</p>
            <h3>Small moments worth saving</h3>
            <p>
              Take 5 minutes to note what you learned, who you met, or what made you
              pause. Revisit the thread later in your entries list.
            </p>
            <ul className="checklist">
              <li>Quick capture</li>
              <li>Cloud storage</li>
              <li>Sorted by recency</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="icon">&#x270D;&#xFE0F;</div>
          <h3>Frictionless entry</h3>
          <p>Title, date, and content in one clean form. Templates help you start fast.</p>
        </div>
        <div className="feature-card">
          <div className="icon">&#x1F512;</div>
          <h3>Yours to keep</h3>
          <p>Your entries are private, secured with your account, and synced across all your devices.</p>
        </div>
        <div className="feature-card">
          <div className="icon">&#x1F9ED;</div>
          <h3>Guided structure</h3>
          <p>Daily, weekly, reflection, and book-note templates keep thoughts organized.</p>
        </div>
        <div className="feature-card">
          <div className="icon">&#x1F317;</div>
          <h3>Accessible contrast</h3>
          <p>High contrast palette, focus states, and semantic markup for all readers.</p>
        </div>
      </section>

      <section className="callout">
        <div>
          <h3>Stay consistent, stay curious.</h3>
          <p>Set a cadence, revisit past entries, and spot patterns over time.</p>
        </div>
        <Link className="btn primary" to="/journal">Open journal</Link>
      </section>
    </>
  );
}
