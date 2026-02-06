import { useCallback, useRef } from 'react';

export function useDashboardLayout(widgets, updateLayouts) {
  const debounceRef = useRef(null);

  const handleLayoutChange = useCallback((layout) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateLayouts(layout);
    }, 500);
  }, [updateLayouts]);

  const getLayoutItems = useCallback(() => {
    return widgets
      .filter(w => w.enabled)
      .map(w => ({
        i: w.id,
        x: w.layout?.x ?? 0,
        y: w.layout?.y ?? 0,
        w: w.layout?.w ?? 2,
        h: w.layout?.h ?? 2,
        minW: 1,
        minH: 1,
      }));
  }, [widgets]);

  return { handleLayoutChange, getLayoutItems };
}
