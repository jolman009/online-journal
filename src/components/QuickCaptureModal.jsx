import { useState, useEffect, useRef } from 'react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢' },
  { value: 2, emoji: '😔' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];

export default function QuickCaptureModal({ isOpen, onClose, onSave }) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(null);
  const [showMood, setShowMood] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);
  const triggerHaptic = useHapticFeedback();

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setMood(null);
      setShowMood(false);
      setSaving(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, content, mood]);

  const handleSave = async () => {
    if (!content.trim() || saving) return;

    setSaving(true);
    triggerHaptic();

    try {
      await onSave({ content: content.trim(), mood });
      onClose();
    } catch (error) {
      console.error('Failed to save quick capture:', error);
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleMoodSelect = (value) => {
    triggerHaptic();
    setMood(mood === value ? null : value);
  };

  if (!isOpen) return null;

  return (
    <div className="quick-capture-overlay" onClick={handleOverlayClick}>
      <div className="quick-capture-modal" role="dialog" aria-modal="true" aria-label="Quick capture">
        <div className="quick-capture-header">
          <span className="quick-capture-title">Quick Capture</span>
          <button
            type="button"
            className="quick-capture-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="quick-capture-textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={saving}
        />

        <div className="quick-capture-footer">
          <div className="quick-capture-options">
            <button
              type="button"
              className={`quick-capture-option-btn${showMood ? ' quick-capture-option-btn--active' : ''}`}
              onClick={() => setShowMood(!showMood)}
              aria-expanded={showMood}
            >
              {mood ? MOOD_OPTIONS.find(m => m.value === mood)?.emoji : '😊'} Mood
            </button>
          </div>

          <div className="quick-capture-actions">
            <span className="quick-capture-hint">
              <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to save
            </span>
            <button
              type="button"
              className="btn primary"
              onClick={handleSave}
              disabled={!content.trim() || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {showMood && (
          <div className="quick-capture-mood">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`quick-capture-mood-btn${mood === option.value ? ' quick-capture-mood-btn--selected' : ''}`}
                onClick={() => handleMoodSelect(option.value)}
                aria-label={`Mood ${option.value}`}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
