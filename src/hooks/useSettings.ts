import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';
export type Currency = 'EUR' | 'USD' | 'GBP';

interface Settings {
  theme: Theme;
  currency: Currency;
  currencySymbol: string;
  pinEnabled: boolean;
  pin: string | null;
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  spendingAlerts: boolean;
  goalAlerts: boolean;
}

const SETTINGS_KEY = 'finance_settings';
const PIN_VERIFIED_KEY = 'pin_verified';

const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

const defaultSettings: Settings = {
  theme: 'dark',
  currency: 'EUR',
  currencySymbol: '€',
  pinEnabled: false,
  pin: null,
  notificationsEnabled: true,
  dailyReminder: false,
  spendingAlerts: true,
  goalAlerts: true,
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
        // Only lock if PIN is enabled AND a valid 6-digit PIN exists
        if (parsed.pinEnabled === true && parsed.pin && typeof parsed.pin === 'string' && parsed.pin.length === 6) {
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

  const resetData = useCallback(() => {
    localStorage.removeItem('finance_data');
    window.location.reload();
  }, []);

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
    updateSettings,
    resetData,
  };
}
