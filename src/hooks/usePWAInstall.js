import { useState, useEffect } from 'react';

// Register at module scope so the event is captured even before React mounts
let deferredPrompt = null;
let _setState = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (_setState) _setState(true);
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (_setState) _setState(false);
});

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);

  useEffect(() => {
    _setState = setCanInstall;
    // Sync in case the event fired between module load and component mount
    if (deferredPrompt) setCanInstall(true);
    return () => { _setState = null; };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    deferredPrompt = null;
  };

  return { canInstall, install };
}
