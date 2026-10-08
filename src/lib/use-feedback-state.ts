import { useCallback, useRef, useState, type SetStateAction } from 'react';
import { notify } from './notifications';

// Keep contextual messages in the page and also announce them through the app's
// shared alerts. Emit when set, so closing a dialog cannot lose its feedback.
export function useFeedbackState<T extends string | null>(initial: T, variant: 'error' | 'success' = 'error') {
  const [value, setValue] = useState<T>(initial);
  const current = useRef(initial);
  const setFeedback = useCallback((next: SetStateAction<T>) => {
    const resolved = typeof next === 'function' ? next(current.current) : next;
    current.current = resolved;
    setValue(resolved);
    if (resolved) notify[variant](resolved);
  }, [variant]);
  return [value, setFeedback] as const;
}
