import { Suspense, useCallback, useRef } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import WidgetShell from './WidgetShell';
import WidgetRegistry from './WidgetRegistry';
import 'react-grid-layout/css/styles.css';

const BREAKPOINTS = { lg: 1100, md: 768, sm: 500, xs: 0 };
const COLS = { lg: 4, md: 3, sm: 2, xs: 1 };
const ROW_HEIGHT = 160;

export default function WidgetGrid({
  widgets,
  entries,
  todos,
  editMode,
  onRemoveWidget,
  onSettingsWidget,
  onLayoutChange,
}) {
  const { containerRef, width } = useContainerWidth({ initialWidth: 1100 });
  const debounceRef = useRef(null);

  const handleLayoutChange = useCallback((layout) => {
    if (!editMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onLayoutChange?.(layout);
    }, 500);
  }, [editMode, onLayoutChange]);

  const enabledWidgets = widgets.filter(w => w.enabled);

  const layoutItems = enabledWidgets.map(w => ({
    i: w.id,
    x: w.layout?.x ?? 0,
    y: w.layout?.y ?? 0,
    w: w.layout?.w ?? 2,
    h: w.layout?.h ?? 2,
    minW: 1,
    minH: 1,
    static: !editMode,
  }));

  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        className="widget-grid"
        width={width}
        layouts={{ lg: layoutItems, md: layoutItems, sm: layoutItems, xs: layoutItems }}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-shell__header"
        compactType="vertical"
        margin={[16, 16]}
      >
        {enabledWidgets.map(widget => {
          const reg = WidgetRegistry[widget.type];
          if (!reg) return null;
          const WidgetComponent = reg.component;

          return (
            <div key={widget.id}>
              <WidgetShell
                title={reg.label}
                editMode={editMode}
                onRemove={() => onRemoveWidget?.(widget.id)}
                onSettings={() => onSettingsWidget?.(widget)}
              >
                <Suspense fallback={<div className="widget-loading">Loading...</div>}>
                  <WidgetComponent
                    config={widget.config || {}}
                    entries={entries}
                    todos={todos}
                  />
                </Suspense>
              </WidgetShell>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
