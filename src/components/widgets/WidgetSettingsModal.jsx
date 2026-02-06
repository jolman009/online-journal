import { useState, useEffect, useRef } from 'react';
import WidgetRegistry from './WidgetRegistry';

const STAT_OPTIONS = [
  { value: 'total_entries', label: 'Total Entries' },
  { value: 'total_todos', label: 'Total Todos' },
  { value: 'completion_rate', label: 'Completion Rate' },
  { value: 'avg_mood', label: 'Average Mood' },
  { value: 'entries_this_month', label: 'Entries This Month' },
];

export default function WidgetSettingsModal({ widget, isOpen, onClose, onSave }) {
  const [config, setConfig] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && widget) {
      setConfig(widget.config || {});
      setTimeout(() => modalRef.current?.focus(), 10);
    }
  }, [isOpen, widget]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !widget) return null;

  const reg = WidgetRegistry[widget.type];

  const handleSave = () => {
    onSave(widget.id, { config });
    onClose();
  };

  const renderFields = () => {
    switch (widget.type) {
      case 'mood_chart':
        return (
          <>
            <div className="widget-settings-modal__field">
              <label>Chart Type</label>
              <select
                value={config.chartType || 'line'}
                onChange={e => setConfig(c => ({ ...c, chartType: e.target.value }))}
              >
                <option value="line">Line</option>
                <option value="bar">Bar</option>
              </select>
            </div>
            <div className="widget-settings-modal__field">
              <label>Date Range (days)</label>
              <select
                value={config.range || 30}
                onChange={e => setConfig(c => ({ ...c, range: Number(e.target.value) }))}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </>
        );

      case 'goal_tracker':
        return (
          <div className="widget-settings-modal__field">
            <label>Weekly Goal (entries)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={config.weeklyGoal || 5}
              onChange={e => setConfig(c => ({ ...c, weeklyGoal: Number(e.target.value) }))}
            />
          </div>
        );

      case 'quick_stats':
        return (
          <div className="widget-settings-modal__field">
            <label>Stats to show (select up to 4)</label>
            {STAT_OPTIONS.map(opt => {
              const selected = (config.stats || ['total_entries', 'total_todos', 'completion_rate', 'avg_mood']);
              const isChecked = selected.includes(opt.value);
              return (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newStats = isChecked
                        ? selected.filter(s => s !== opt.value)
                        : [...selected, opt.value].slice(0, 4);
                      setConfig(c => ({ ...c, stats: newStats }));
                    }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        );

      case 'todos':
      case 'recent_entries':
        return (
          <div className="widget-settings-modal__field">
            <label>Number of items</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.limit || 5}
              onChange={e => setConfig(c => ({ ...c, limit: Number(e.target.value) }))}
            />
          </div>
        );

      default:
        return (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            No configurable settings for this widget.
          </p>
        );
    }
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="widget-settings-modal"
        onClick={e => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="widget-settings-modal__header">
          <h2>{reg?.label || 'Widget'} Settings</h2>
          <button className="widget-shell__btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="widget-settings-modal__body">
          {renderFields()}
        </div>
        <div className="widget-settings-modal__footer">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
