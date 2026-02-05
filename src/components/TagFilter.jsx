export default function TagFilter({ availableTags, selectedTags, onToggle, onClear }) {
  if (availableTags.length === 0) return null;

  return (
    <div className="tag-filter">
      <div className="tag-filter__chips">
        {availableTags.map(tag => (
          <button
            key={tag}
            type="button"
            className={`tag-filter__chip${selectedTags.includes(tag) ? ' tag-filter__chip--active' : ''}`}
            onClick={() => onToggle(tag)}
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button
            type="button"
            className="tag-filter__clear"
            onClick={onClear}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
