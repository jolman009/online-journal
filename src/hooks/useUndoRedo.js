import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 500;

export function useUndoRedo(initialValue = '') {
  const [history, setHistory] = useState([initialValue]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const debounceRef = useRef(null);
  const lastPushedRef = useRef(initialValue);

  const currentValue = history[historyIndex];

  const pushToHistory = useCallback((newValue) => {
    // Don't push if value hasn't changed
    if (newValue === lastPushedRef.current) return;

    // Clear any pending debounced push
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce history pushes to avoid flooding on every keystroke
    debounceRef.current = setTimeout(() => {
      setHistory(prev => {
        // Remove any forward history when adding new state
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newValue);

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
      lastPushedRef.current = newValue;
    }, DEBOUNCE_MS);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      return history[historyIndex - 1];
    }
    return currentValue;
  }, [historyIndex, history, currentValue]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      return history[historyIndex + 1];
    }
    return currentValue;
  }, [historyIndex, history, currentValue]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const reset = useCallback((newValue = '') => {
    setHistory([newValue]);
    setHistoryIndex(0);
    lastPushedRef.current = newValue;
  }, []);

  return {
    currentValue,
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
