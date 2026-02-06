import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrompts } from '../../hooks/usePrompts';

export default function DailyPromptWidget() {
  const { getRandomPrompt } = usePrompts();
  const [prompt, setPrompt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPrompt(getRandomPrompt());
  }, [getRandomPrompt]);

  const handleRefresh = () => {
    setPrompt(getRandomPrompt());
  };

  const handleWrite = () => {
    const text = prompt?.text || '';
    navigate(`/new-entry?prompt=${encodeURIComponent(text)}`);
  };

  return (
    <div className="daily-prompt-widget">
      <p className="daily-prompt-widget__text">
        {prompt?.text || 'Loading prompt...'}
      </p>
      <div className="daily-prompt-widget__actions">
        <button className="daily-prompt-widget__btn" onClick={handleRefresh}>
          Refresh
        </button>
        <button className="daily-prompt-widget__btn daily-prompt-widget__btn--primary" onClick={handleWrite}>
          Write about this
        </button>
      </div>
    </div>
  );
}
