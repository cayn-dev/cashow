import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD';

interface Settings {
  theme: Theme;
  currency: Currency;
  currencySymbol: string;
  pinEnabled: boolean;
  pin: string | null;
  biometricEnabled: boolean;
  biometricCredentialId: string | null;
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  spendingAlerts: boolean;
  goalAlerts: boolean;
  spendingLimit: number;
  autoLockTimeout: number; // minutes, 0 = disabled
  compactView: boolean;
  showDecimals: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

const SETTINGS_KEY = 'finance_settings';
const PIN_VERIFIED_KEY = 'pin_verified';

const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export const currencyNames: Record<Currency, string> = {
  EUR: 'Euro',
  USD: 'Dollaro USA',
  GBP: 'Sterlina',
  CHF: 'Franco Svizzero',
  JPY: 'Yen Giapponese',
  CAD: 'Dollaro Canadese',
  AUD: 'Dollaro Australiano',
};

const defaultSettings: Settings = {
  theme: 'dark',
  currency: 'EUR',
  currencySymbol: '€',
  pinEnabled: false,
  pin: null,
  biometricEnabled: false,
  biometricCredentialId: null,
  notificationsEnabled: true,
  dailyReminder: false,
  spendingAlerts: true,
  goalAlerts: true,
  spendingLimit: 1000,
  autoLockTimeout: 0,
  compactView: false,
  showDecimals: true,
  soundEnabled: true,
  hapticEnabled: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Lock if PIN is enabled with valid 6-digit PIN OR biometric is enabled
        const hasPinLock = parsed.pinEnabled === true && parsed.pin && typeof parsed.pin === 'string' && parsed.pin.length === 6;
        const hasBiometricLock = parsed.biometricEnabled === true && parsed.biometricCredentialId;
        if (hasPinLock || hasBiometricLock) {
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  });

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }, [settings.theme]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      // Update currency symbol when currency changes
      if (updates.currency) {
        newSettings.currencySymbol = currencySymbols[updates.currency];
      }
      return newSettings;
    });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    updateSettings({ theme });
  }, [updateSettings]);

  const setCurrency = useCallback((currency: Currency) => {
    updateSettings({ currency, currencySymbol: currencySymbols[currency] });
  }, [updateSettings]);

  const setPin = useCallback((pin: string | null) => {
    if (pin === null) {
      updateSettings({ pinEnabled: false, pin: null });
      sessionStorage.removeItem(PIN_VERIFIED_KEY);
      setIsLocked(false);
    } else {
      updateSettings({ pinEnabled: true, pin });
      sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
      setIsLocked(false);
    }
  }, [updateSettings]);

  const verifyPin = useCallback((inputPin: string): boolean => {
    if (inputPin === settings.pin) {
      sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
      setIsLocked(false);
      return true;
    }
    return false;
  }, [settings.pin]);

  const lockApp = useCallback(() => {
    if (settings.pinEnabled && settings.pin) {
      sessionStorage.removeItem(PIN_VERIFIED_KEY);
      setIsLocked(true);
    }
  }, [settings.pinEnabled, settings.pin]);

  const toggleNotifications = useCallback((enabled: boolean) => {
    updateSettings({ notificationsEnabled: enabled });
  }, [updateSettings]);

  const toggleDailyReminder = useCallback((enabled: boolean) => {
    updateSettings({ dailyReminder: enabled });
  }, [updateSettings]);

  const toggleSpendingAlerts = useCallback((enabled: boolean) => {
    updateSettings({ spendingAlerts: enabled });
  }, [updateSettings]);

  const toggleGoalAlerts = useCallback((enabled: boolean) => {
    updateSettings({ goalAlerts: enabled });
  }, [updateSettings]);

  const setSpendingLimit = useCallback((limit: number) => {
    updateSettings({ spendingLimit: limit });
  }, [updateSettings]);

  const setAutoLockTimeout = useCallback((minutes: number) => {
    updateSettings({ autoLockTimeout: minutes });
  }, [updateSettings]);

  const toggleCompactView = useCallback((enabled: boolean) => {
    updateSettings({ compactView: enabled });
  }, [updateSettings]);

  const toggleShowDecimals = useCallback((enabled: boolean) => {
    updateSettings({ showDecimals: enabled });
  }, [updateSettings]);

  const toggleSound = useCallback((enabled: boolean) => {
    updateSettings({ soundEnabled: enabled });
  }, [updateSettings]);

  const toggleHaptic = useCallback((enabled: boolean) => {
    updateSettings({ hapticEnabled: enabled });
  }, [updateSettings]);

  const resetData = useCallback(() => {
    localStorage.removeItem('finance_data');
    window.location.reload();
  }, []);

  // Check if biometric authentication is available
  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }, []);

  // Register biometric credential
  const registerBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'FinanceFlow',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: 'user@financeflow.app',
            displayName: 'FinanceFlow User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        updateSettings({ biometricEnabled: true, biometricCredentialId: credentialId });
        sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }, [updateSettings]);

  // Verify biometric
  const verifyBiometric = useCallback(async (): Promise<boolean> => {
    if (!settings.biometricCredentialId) return false;

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credentialId = Uint8Array.from(atob(settings.biometricCredentialId), c => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              type: 'public-key',
              id: credentialId,
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (assertion) {
        sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  }, [settings.biometricCredentialId]);

  // Disable biometric
  const disableBiometric = useCallback(() => {
    updateSettings({ biometricEnabled: false, biometricCredentialId: null });
  }, [updateSettings]);

  return {
    ...settings,
    isLocked,
    setTheme,
    setCurrency,
    setPin,
    verifyPin,
    lockApp,
    toggleNotifications,
    toggleDailyReminder,
    toggleSpendingAlerts,
    toggleGoalAlerts,
    setSpendingLimit,
    setAutoLockTimeout,
    toggleCompactView,
    toggleShowDecimals,
    toggleSound,
    toggleHaptic,
    updateSettings,
    resetData,
    isBiometricAvailable,
    registerBiometric,
    verifyBiometric,
    disableBiometric,
  };
}
