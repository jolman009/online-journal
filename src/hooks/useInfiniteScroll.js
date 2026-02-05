import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_PAGE_SIZE = 20;

export function useInfiniteScroll(items, pageSize = DEFAULT_PAGE_SIZE) {
  const [displayCount, setDisplayCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Small delay for smoother UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + pageSize, items.length));
      setIsLoadingMore(false);
    }, 150);
  }, [isLoadingMore, hasMore, pageSize, items.length]);

  // Reset when items change significantly (e.g., filter applied)
  useEffect(() => {
    setDisplayCount(pageSize);
  }, [items.length, pageSize]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(currentLoader);

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  return {
    displayedItems,
    hasMore,
    isLoadingMore,
    loaderRef,
    loadMore,
    totalCount: items.length,
    displayedCount: displayedItems.length,
  };
}
