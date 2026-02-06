import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntries } from '../hooks/useEntries';
import { useTodos } from '../hooks/useTodos';
import { useWidgets } from '../hooks/useWidgets';
import WidgetGrid from '../components/widgets/WidgetGrid';
import AddWidgetModal from '../components/widgets/AddWidgetModal';
import WidgetSettingsModal from '../components/widgets/WidgetSettingsModal';

export default function Home() {
  const { user } = useAuth();
  const { entries, fetchEntries } = useEntries();
  const { todos, fetchTodos } = useTodos();
  const { widgets, fetchWidgets, addWidget, removeWidget, updateWidget, updateLayouts } = useWidgets();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editMode, setEditMode] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchTodos();
      fetchWidgets();
    }
  }, [user]);

  // Handle query params from CommandPalette / keyboard shortcuts
  useEffect(() => {
    if (searchParams.get('addWidget')) {
      setAddModalOpen(true);
      setEditMode(true);
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('editMode')) {
      setEditMode(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleRemoveWidget = useCallback(async (id) => {
    await removeWidget(id);
  }, [removeWidget]);

  const handleAddWidget = useCallback(async (type, config, size) => {
    await addWidget(type, config, size);
  }, [addWidget]);

  const [settingsWidget, setSettingsWidget] = useState(null);

  const existingTypes = widgets.filter(w => w.enabled).map(w => w.type);

  if (!user) {
    return (
      <>
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

  return (
    <section className="dashboard">
      <div className="dashboard__header">
        <h2>Dashboard</h2>
        <div className="dashboard__actions">
          <button
            className={`btn ghost${editMode ? ' btn--active' : ''}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Customize'}
          </button>
          {editMode && (
            <button
              className="btn primary"
              onClick={() => setAddModalOpen(true)}
            >
              + Add Widget
            </button>
          )}
        </div>
      </div>

      <WidgetGrid
        widgets={widgets}
        entries={entries}
        todos={todos}
        editMode={editMode}
        onRemoveWidget={handleRemoveWidget}
        onSettingsWidget={setSettingsWidget}
        onLayoutChange={updateLayouts}
      />

      <AddWidgetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddWidget}
        existingTypes={existingTypes}
      />

      <WidgetSettingsModal
        widget={settingsWidget}
        isOpen={!!settingsWidget}
        onClose={() => setSettingsWidget(null)}
        onSave={(id, fields) => updateWidget(id, fields)}
      />
    </section>
  );
}
