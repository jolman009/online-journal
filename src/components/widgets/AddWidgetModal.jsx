import { useState, useEffect, useRef } from 'react';
import WidgetRegistry from './WidgetRegistry';

export default function AddWidgetModal({ isOpen, onClose, onAdd, existingTypes }) {
  const [selectedType, setSelectedType] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setTimeout(() => modalRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableWidgets = Object.entries(WidgetRegistry).filter(
    ([type]) => !existingTypes.includes(type)
  );

  const handleAdd = (type) => {
    const reg = WidgetRegistry[type];
    onAdd(type, {}, reg.defaultSize);
    onClose();
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="add-widget-modal"
        onClick={e => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="add-widget-modal__header">
          <h2>Add Widget</h2>
          <button className="widget-shell__btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="add-widget-modal__list">
          {availableWidgets.length === 0 ? (
            <p className="add-widget-modal__empty">All widgets have been added!</p>
          ) : (
            availableWidgets.map(([type, reg]) => (
              <button
                key={type}
                className={`add-widget-modal__item${selectedType === type ? ' add-widget-modal__item--selected' : ''}`}
                onClick={() => handleAdd(type)}
                onMouseEnter={() => setSelectedType(type)}
              >
                <span className="add-widget-modal__item-label">{reg.label}</span>
                <span className="add-widget-modal__item-desc">{reg.description}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
