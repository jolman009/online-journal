import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { renderMarkdown } from '../utils/markdown';
import EditorToolbar from './EditorToolbar';

const MAX_HISTORY = 50;

export default function MarkdownEditor({ value, onChange }) {
  const [viewMode, setViewMode] = useState('write'); // 'write' | 'preview' | 'split'
  const textareaRef = useRef(null);

  // Undo/Redo history
  const [history, setHistory] = useState([value || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyTimeoutRef = useRef(null);
  const lastSavedValueRef = useRef(value || '');

  const wordCount = useMemo(() => {
    if (!value || !value.trim()) return 0;
    return value.split(/\s+/).filter(Boolean).length;
  }, [value]);

  // Reset history when value changes externally (e.g., template selection)
  useEffect(() => {
    if (value !== history[historyIndex]) {
      setHistory([value || '']);
      setHistoryIndex(0);
      lastSavedValueRef.current = value || '';
    }
  }, []);

  const pushToHistory = useCallback((newValue) => {
    if (newValue === lastSavedValueRef.current) return;

    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newValue);
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
      lastSavedValueRef.current = newValue;
    }, 500);
  }, [historyIndex]);

  const handleChange = (newValue) => {
    onChange(newValue);
    pushToHistory(newValue);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const undoneValue = history[newIndex];
      onChange(undoneValue);
      lastSavedValueRef.current = undoneValue;
    }
  }, [historyIndex, history, onChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const redoneValue = history[newIndex];
      onChange(redoneValue);
      lastSavedValueRef.current = redoneValue;
    }
  }, [historyIndex, history, onChange]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts for undo/redo and formatting
  const handleKeyDown = useCallback((e) => {
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if (isMod && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      handleRedo();
    } else if (isMod && e.key === 'y') {
      e.preventDefault();
      handleRedo();
    } else if (isMod && e.key === 'b') {
      e.preventDefault();
      applyInlineFormat('**', '**');
    } else if (isMod && e.key === 'i') {
      e.preventDefault();
      applyInlineFormat('_', '_');
    }
  }, [handleUndo, handleRedo]);

  const applyInlineFormat = (prefix, suffix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeSelection = value.substring(0, start);
    const afterSelection = value.substring(end);

    const newText = beforeSelection + prefix + selectedText + suffix + afterSelection;
    handleChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = selectedText
        ? start + prefix.length + selectedText.length + suffix.length
        : start + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Sync scroll in split mode
  const previewRef = useRef(null);
  const handleTextareaScroll = () => {
    if (viewMode === 'split' && textareaRef.current && previewRef.current) {
      const textarea = textareaRef.current;
      const preview = previewRef.current;
      const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
      preview.scrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);
    }
  };

  return (
    <div className={`markdown-editor markdown-editor--${viewMode}`}>
      <div className="editor-header">
        <div className="editor-tabs">
          <button
            type="button"
            className={`editor-tab${viewMode === 'write' ? ' editor-tab--active' : ''}`}
            onClick={() => setViewMode('write')}
          >
            Write
          </button>
          <button
            type="button"
            className={`editor-tab${viewMode === 'preview' ? ' editor-tab--active' : ''}`}
            onClick={() => setViewMode('preview')}
          >
            Preview
          </button>
          <button
            type="button"
            className={`editor-tab${viewMode === 'split' ? ' editor-tab--active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Side-by-side view"
          >
            Split
          </button>
        </div>
        <span className="editor-tabs__word-count">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>

      {viewMode !== 'preview' && (
        <EditorToolbar
          textareaRef={textareaRef}
          value={value}
          onChange={handleChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      <div className="editor-content">
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className="editor-pane editor-pane--write">
            <textarea
              ref={textareaRef}
              id="content"
              name="content"
              required
              aria-required="true"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleTextareaScroll}
              placeholder="Start writing..."
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            ref={previewRef}
            className="editor-pane editor-pane--preview entry-card__content"
            dangerouslySetInnerHTML={{
              __html: value?.trim()
                ? renderMarkdown(value)
                : '<p class="muted">Nothing to preview yet.</p>',
            }}
          />
        )}
      </div>
    </div>
  );
}
