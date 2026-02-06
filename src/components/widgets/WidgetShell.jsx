export default function WidgetShell({ title, children, onRemove, onSettings, editMode }) {
  return (
    <div className="widget-shell">
      <div className="widget-shell__header">
        <h3 className="widget-shell__title">{title}</h3>
        {editMode && (
          <div className="widget-shell__actions">
            {onSettings && (
              <button
                className="widget-shell__btn"
                onClick={onSettings}
                aria-label="Widget settings"
                title="Settings"
              >
                ⚙
              </button>
            )}
            {onRemove && (
              <button
                className="widget-shell__btn widget-shell__btn--danger"
                onClick={onRemove}
                aria-label="Remove widget"
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
      <div className="widget-shell__body">
        {children}
      </div>
    </div>
  );
}
