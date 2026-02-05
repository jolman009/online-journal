import { useCallback } from 'react';

/**
 * Custom hook to provide haptic feedback using the Vibration API.
 * @returns {function(number?): void} A function to trigger haptic feedback.
 */
export function useHapticFeedback() {
  const triggerHaptic = useCallback((duration = 50) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    } else {
      // console.warn('Vibration API not supported.');
    }
  }, []);

  return triggerHaptic;
}
