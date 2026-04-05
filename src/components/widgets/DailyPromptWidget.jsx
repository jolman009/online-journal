import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrompts } from '../../hooks/usePrompts';

export default function DailyPromptWidget({ config, onUpdateConfig }) {
  const { prompts, getRandomPrompt } = usePrompts();
  const [prompt, setPrompt] = useState(null);
  const navigate = useNavigate();

  const pinnedPromptId = config.pinnedPromptId;

  useEffect(() => {
    if (pinnedPromptId && prompts.length > 0) {
      const pinned = prompts.find(p => p.id === pinnedPromptId);
      if (pinned) {
        setPrompt(pinned);
        return;
      }
    }
    if (!prompt && prompts.length > 0) {
      setPrompt(getRandomPrompt());
    }
  }, [pinnedPromptId, prompts, getRandomPrompt, prompt]);

  const handleRefresh = () => {
    setPrompt(getRandomPrompt());
    if (pinnedPromptId) {
      onUpdateConfig({ ...config, pinnedPromptId: null });
    }
  };

  const handleTogglePin = () => {
    if (pinnedPromptId) {
      onUpdateConfig({ ...config, pinnedPromptId: null });
    } else if (prompt) {
      onUpdateConfig({ ...config, pinnedPromptId: prompt.id });
    }
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
          {pinnedPromptId ? 'Unpin & Skip' : 'Skip'}
        </button>
        <button 
          className={`daily-prompt-widget__btn${pinnedPromptId ? ' daily-prompt-widget__btn--primary' : ''}`} 
          onClick={handleTogglePin}
        >
          {pinnedPromptId ? '📌 Pinned' : 'Pin'}
        </button>
        <button className="daily-prompt-widget__btn daily-prompt-widget__btn--primary" onClick={handleWrite}>
          Write
        </button>
      </div>
    </div>
  );
}
