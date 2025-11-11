import { useCallback, useState, useEffect } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export const useUndoHistory = <T,>(initialState: T, maxHistory: number = 6) => {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Sincronizar quando o initialState mudar (ex: ao carregar um novo projeto)
  useEffect(() => {
    setHistory((prevHistory) => {
      if (JSON.stringify(prevHistory.present) !== JSON.stringify(initialState)) {
        return {
          past: [],
          present: initialState,
          future: [],
        };
      }
      return prevHistory;
    });
  }, [initialState]);

  const setState = useCallback(
    (newState: T) => {
      setHistory((prevHistory) => ({
        past: [...prevHistory.past, prevHistory.present].slice(-maxHistory),
        present: newState,
        future: [],
      }));
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.past.length === 0) return prevHistory;

      const newPast = prevHistory.past.slice(0, -1);
      const newPresent = prevHistory.past[prevHistory.past.length - 1];

      return {
        past: newPast,
        present: newPresent,
        future: [prevHistory.present, ...prevHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.future.length === 0) return prevHistory;

      const newFuture = prevHistory.future.slice(1);
      const newPresent = prevHistory.future[0];

      return {
        past: [...prevHistory.past, prevHistory.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
  };
};
