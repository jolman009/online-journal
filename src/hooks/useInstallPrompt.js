import { useState, useEffect, useCallback } from 'react';

const VISIT_KEY = 'jotflow_visit_count';
const DISMISSED_KEY = 'jotflow_install_dismissed';
const MIN_VISITS = 3;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Track visits
    const visits = Number(localStorage.getItem(VISIT_KEY) || 0) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));

    // Already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // User previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = Number(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (visits >= MIN_VISITS) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }, []);

  return { showBanner, installed, install, dismiss };
}
