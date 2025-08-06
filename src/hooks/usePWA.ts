import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  showInstallPrompt: () => Promise<void>;
  installationResult: 'accepted' | 'dismissed' | null;
}

export const usePWA = (): PWAState => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installationResult, setInstallationResult] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    // בדיקה אם האפליקציה כבר מותקנת
    const checkIfInstalled = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppMode = (window.navigator as any).standalone === true;
      setIsInstalled(isInStandaloneMode || isInWebAppMode);
    };

    // מאזין לinstall prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('💡 PWA install prompt available');
    };

    // מאזין לinstallation מוצלחת
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // מאזינים לsטטוס רשת
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // הוספת מאזינים
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // בדיקה ראשונית
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showInstallPrompt = async (): Promise<void> => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      setInstallationResult(outcome);
      console.log(`PWA installation ${outcome}`);
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    showInstallPrompt,
    installationResult
  };
};
