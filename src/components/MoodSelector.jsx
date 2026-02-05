import { useHapticFeedback } from '../hooks/useHapticFeedback';

const MOODS = [
  { value: 1, label: 'Awful', emoji: '😢' },
  { value: 2, label: 'Bad', emoji: '😔' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
];

export default function MoodSelector({ value, onChange, disabled }) {
  const triggerHaptic = useHapticFeedback();

  const handleSelect = (moodValue) => {
    if (disabled) return;
    triggerHaptic();
    onChange(moodValue === value ? null : moodValue);
  };

  return (
    <div className="mood-selector">
      <div className="mood-selector__options">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            type="button"
            className={`mood-selector__option${value === mood.value ? ' mood-selector__option--selected' : ''}`}
            onClick={() => handleSelect(mood.value)}
            disabled={disabled}
            aria-label={mood.label}
            title={mood.label}
          >
            <span className="mood-selector__emoji">{mood.emoji}</span>
            <span className="mood-selector__label">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { MOODS };
