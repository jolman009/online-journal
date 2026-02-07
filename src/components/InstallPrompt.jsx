import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { showBanner, install, dismiss } = useInstallPrompt();

  if (!showBanner) return null;

  return (
    <div className="install-prompt">
      <span className="install-prompt__text">
        Install JotFlow for quick access and offline use
      </span>
      <div className="install-prompt__actions">
        <button className="install-prompt__btn install-prompt__btn--primary" onClick={install}>
          Install
        </button>
        <button className="install-prompt__btn" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
