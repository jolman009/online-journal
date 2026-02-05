const TOOLBAR_ITEMS = [
  { id: 'bold', label: 'Bold', icon: 'B', prefix: '**', suffix: '**', shortcut: 'Ctrl+B' },
  { id: 'italic', label: 'Italic', icon: 'I', prefix: '_', suffix: '_', shortcut: 'Ctrl+I' },
  { id: 'strikethrough', label: 'Strikethrough', icon: 'S', prefix: '~~', suffix: '~~' },
  { id: 'divider1', type: 'divider' },
  { id: 'h1', label: 'Heading 1', icon: 'H1', prefix: '# ', suffix: '', block: true },
  { id: 'h2', label: 'Heading 2', icon: 'H2', prefix: '## ', suffix: '', block: true },
  { id: 'h3', label: 'Heading 3', icon: 'H3', prefix: '### ', suffix: '', block: true },
  { id: 'divider2', type: 'divider' },
  { id: 'ul', label: 'Bullet List', icon: '•', prefix: '- ', suffix: '', block: true },
  { id: 'ol', label: 'Numbered List', icon: '1.', prefix: '1. ', suffix: '', block: true },
  { id: 'task', label: 'Task', icon: '☐', prefix: '- [ ] ', suffix: '', block: true },
  { id: 'divider3', type: 'divider' },
  { id: 'quote', label: 'Quote', icon: '"', prefix: '> ', suffix: '', block: true },
  { id: 'code', label: 'Inline Code', icon: '<>', prefix: '`', suffix: '`' },
  { id: 'codeblock', label: 'Code Block', icon: '{}', prefix: '```\n', suffix: '\n```', block: true },
  { id: 'divider4', type: 'divider' },
  { id: 'link', label: 'Link', icon: '🔗', prefix: '[', suffix: '](url)', placeholder: 'text' },
  { id: 'hr', label: 'Horizontal Rule', icon: '—', prefix: '\n---\n', suffix: '', block: true },
];

export default function EditorToolbar({ textareaRef, value, onChange, canUndo, canRedo, onUndo, onRedo }) {
  const applyFormat = (item) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || item.placeholder || '';

    let newText;
    let newCursorPos;

    if (item.block) {
      // For block-level formatting, ensure we're at the start of a line
      const beforeSelection = value.substring(0, start);
      const afterSelection = value.substring(end);
      const needsNewlineBefore = beforeSelection.length > 0 && !beforeSelection.endsWith('\n');

      const prefix = needsNewlineBefore ? '\n' + item.prefix : item.prefix;
      newText = beforeSelection + prefix + selectedText + item.suffix + afterSelection;
      newCursorPos = start + prefix.length + selectedText.length;
    } else {
      // Inline formatting
      const beforeSelection = value.substring(0, start);
      const afterSelection = value.substring(end);
      newText = beforeSelection + item.prefix + selectedText + item.suffix + afterSelection;

      if (selectedText) {
        newCursorPos = start + item.prefix.length + selectedText.length + item.suffix.length;
      } else {
        newCursorPos = start + item.prefix.length;
      }
    }

    onChange(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar__group">
        {TOOLBAR_ITEMS.map(item => {
          if (item.type === 'divider') {
            return <span key={item.id} className="editor-toolbar__divider" />;
          }
          return (
            <button
              key={item.id}
              type="button"
              className="editor-toolbar__btn"
              onClick={() => applyFormat(item)}
              title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
      <div className="editor-toolbar__group editor-toolbar__group--right">
        <button
          type="button"
          className="editor-toolbar__btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          className="editor-toolbar__btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          ↷
        </button>
      </div>
    </div>
  );
}
