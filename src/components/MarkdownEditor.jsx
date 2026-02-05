import { useState, useMemo } from 'react';
import { renderMarkdown } from '../utils/markdown';

export default function MarkdownEditor({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('write');

  const wordCount = useMemo(() => {
    if (!value || !value.trim()) return 0;
    return value.split(/\s+/).filter(Boolean).length;
  }, [value]);

  return (
    <>
      <div className="editor-tabs">
        <button
          type="button"
          className={`editor-tab${activeTab === 'write' ? ' editor-tab--active' : ''}`}
          onClick={() => setActiveTab('write')}
        >
          Write
        </button>
        <button
          type="button"
          className={`editor-tab${activeTab === 'preview' ? ' editor-tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <span className="editor-tabs__word-count">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>
      {activeTab === 'write' ? (
        <div className="editor-pane">
          <textarea
            id="content"
            name="content"
            required
            aria-required="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <div
          className="editor-pane editor-pane--preview entry-card__content"
          dangerouslySetInnerHTML={{
            __html: value.trim()
              ? renderMarkdown(value)
              : '<p class="muted">Nothing to preview yet.</p>',
          }}
        />
      )}
    </>
  );
}
