import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts({ onOpenCommandPalette, searchInputRef }) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e) => {
    // Ignore if typing in an input, textarea, or contenteditable
    const target = e.target;
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Cmd/Ctrl+K for command palette (works even when typing)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onOpenCommandPalette?.();
      return;
    }

    // Don't process other shortcuts while typing
    if (isTyping) return;

    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        navigate('/new-entry');
        break;
      case 't':
        e.preventDefault();
        navigate('/todos');
        break;
      case '/':
        e.preventDefault();
        searchInputRef?.current?.focus();
        break;
      default:
        break;
    }
  }, [navigate, onOpenCommandPalette, searchInputRef]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
