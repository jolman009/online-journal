import { useState, useRef, useCallback } from 'react';
import { useHapticFeedback } from './useHapticFeedback'; // Import useHapticFeedback

const THRESHOLD = 80;
const MAX_PULL = 120;

export function usePullToRefresh(onRefresh) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const triggerHaptic = useHapticFeedback(); // Initialize haptic feedback hook

  const handleTouchStart = useCallback((e) => {
    // Only enable pull-to-refresh when at top of page
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);

    // Apply resistance
    const resistedDistance = Math.min(distance * 0.5, MAX_PULL);
    setPullDistance(resistedDistance);

    // Prevent default scroll when pulling
    if (distance > 10) {
      e.preventDefault();
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Hold at indicator position

      try {
        await onRefresh();
        triggerHaptic(); // Trigger haptic feedback on successful refresh
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    setIsPulling(false);
  }, [isPulling, pullDistance, isRefreshing, onRefresh, triggerHaptic]);

  const pullProgress = Math.min(pullDistance / THRESHOLD, 1);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
