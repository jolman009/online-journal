import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'new-entry', label: 'New Entry', shortcut: 'N', action: '/new-entry', category: 'Navigation' },
  { id: 'journal', label: 'Go to Journal', action: '/journal', category: 'Navigation' },
  { id: 'todos', label: 'Go to Todos', shortcut: 'T', action: '/todos', category: 'Navigation' },
  { id: 'calendar', label: 'Go to Calendar', action: '/calendar', category: 'Navigation' },
  { id: 'review', label: 'Go to Weekly Review', action: '/review', category: 'Navigation' },
  { id: 'home', label: 'Go to Home', action: '/', category: 'Navigation' },
  { id: 'daily', label: 'New Daily Entry', action: '/new-entry?template=daily', category: 'Templates' },
  { id: 'weekly', label: 'New Weekly Plan', action: '/new-entry?template=weekly', category: 'Templates' },
  { id: 'reflection', label: 'New Reflection', action: '/new-entry?template=reflection', category: 'Templates' },
  { id: 'book', label: 'New Book Notes', action: '/new-entry?template=book', category: 'Templates' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    // Scroll selected item into view
    if (listRef.current && filteredCommands.length > 0) {
      const selectedItem = listRef.current.children[selectedIndex];
      selectedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, filteredCommands.length]);

  const executeCommand = (command) => {
    onClose();
    if (command.action.startsWith('/')) {
      navigate(command.action);
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette__search">
          <input
            ref={inputRef}
            type="text"
            className="command-palette__input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-palette__kbd">esc</kbd>
        </div>
        <div className="command-palette__list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette__empty">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                type="button"
                className={`command-palette__item${index === selectedIndex ? ' command-palette__item--selected' : ''}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="command-palette__item-label">{cmd.label}</span>
                <span className="command-palette__item-meta">
                  {cmd.shortcut && <kbd className="command-palette__shortcut">{cmd.shortcut}</kbd>}
                  <span className="command-palette__category">{cmd.category}</span>
                </span>
              </button>
            ))
          )}
        </div>
        <div className="command-palette__footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
