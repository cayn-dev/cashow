import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD';
export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
export type FirstDayOfWeek = 'monday' | 'sunday';

// Budget per category
export interface CategoryBudget {
  category: string;
  limit: number;
  enabled: boolean;
}

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
  soundVolume: number; // 0..1
  // New useful settings
  dailySpendingLimit: number; // 0 = disabled
  dailySpendingAlerts: boolean;
  roundUpSavings: boolean; // Round up to nearest euro for savings
  roundUpAmount: number; // 1 = next euro, 5 = next 5 euros, 10 = next 10
  dateFormat: DateFormat;
  firstDayOfWeek: FirstDayOfWeek;
  categoryBudgets: CategoryBudget[];
  showMonthlyComparison: boolean;
  defaultPaymentMethod: string;
  weeklyReportEnabled: boolean;
  weeklyReportDay: number; // 0 = Sunday, 1 = Monday, etc.
  hideSmallTransactions: boolean;
  smallTransactionThreshold: number;
  quickAddEnabled: boolean;
  quickAddAmount: number;
}

const SETTINGS_KEY = 'finance_settings';
const PIN_VERIFIED_KEY = 'pin_verified';
const PIN_SALT = 'financeflow:v1:pin';

// Hash a PIN using SHA-256 with a static app-level salt.
// This prevents storing the raw PIN in localStorage; verification compares hashes.
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${PIN_SALT}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

export const dateFormatLabels: Record<DateFormat, string> = {
  'dd/MM/yyyy': 'Europeo (31/12/2024)',
  'MM/dd/yyyy': 'Americano (12/31/2024)',
  'yyyy-MM-dd': 'ISO (2024-12-31)',
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
  soundVolume: 0.6,
  // New defaults
  dailySpendingLimit: 0,
  dailySpendingAlerts: false,
  roundUpSavings: false,
  roundUpAmount: 1,
  dateFormat: 'dd/MM/yyyy',
  firstDayOfWeek: 'monday',
  categoryBudgets: [],
  showMonthlyComparison: true,
  defaultPaymentMethod: 'card',
  weeklyReportEnabled: false,
  weeklyReportDay: 1, // Monday
  hideSmallTransactions: false,
  smallTransactionThreshold: 1,
  quickAddEnabled: true,
  quickAddAmount: 10,
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

  const setPin = useCallback(async (pin: string | null) => {
    if (pin === null) {
      updateSettings({ pinEnabled: false, pin: null });
      sessionStorage.removeItem(PIN_VERIFIED_KEY);
      setIsLocked(false);
    } else {
      const hashed = await hashPin(pin);
      updateSettings({ pinEnabled: true, pin: hashed });
      sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
      setIsLocked(false);
    }
  }, [updateSettings]);

  const verifyPin = useCallback(async (inputPin: string): Promise<boolean> => {
    if (!settings.pin) return false;
    // Support legacy plaintext PINs by upgrading them on first successful verify
    if (settings.pin.length === 6 && /^\d{6}$/.test(settings.pin)) {
      if (inputPin === settings.pin) {
        const hashed = await hashPin(inputPin);
        updateSettings({ pin: hashed });
        sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
        setIsLocked(false);
        return true;
      }
      return false;
    }
    const hashed = await hashPin(inputPin);
    if (hashed === settings.pin) {
      sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
      setIsLocked(false);
      return true;
    }
    return false;
  }, [settings.pin, updateSettings]);

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

  const setSoundVolume = useCallback((volume: number) => {
    updateSettings({ soundVolume: Math.max(0, Math.min(1, volume)) });
  }, [updateSettings]);

  const resetData = useCallback(() => {
    localStorage.removeItem('finance_data');
    localStorage.removeItem('finance_data_backup');
    localStorage.removeItem('finance_initialized');
    window.location.reload();
  }, []);

  // New setting functions
  const setDailySpendingLimit = useCallback((limit: number) => {
    updateSettings({ dailySpendingLimit: limit, dailySpendingAlerts: limit > 0 });
  }, [updateSettings]);

  const toggleRoundUpSavings = useCallback((enabled: boolean) => {
    updateSettings({ roundUpSavings: enabled });
  }, [updateSettings]);

  const setRoundUpAmount = useCallback((amount: number) => {
    updateSettings({ roundUpAmount: amount });
  }, [updateSettings]);

  const setDateFormat = useCallback((format: DateFormat) => {
    updateSettings({ dateFormat: format });
  }, [updateSettings]);

  const setFirstDayOfWeek = useCallback((day: FirstDayOfWeek) => {
    updateSettings({ firstDayOfWeek: day });
  }, [updateSettings]);

  const setCategoryBudget = useCallback((category: string, limit: number, enabled: boolean) => {
    const budgets = [...settings.categoryBudgets];
    const existingIndex = budgets.findIndex(b => b.category === category);
    
    if (existingIndex >= 0) {
      if (limit === 0 && !enabled) {
        budgets.splice(existingIndex, 1);
      } else {
        budgets[existingIndex] = { category, limit, enabled };
      }
    } else if (limit > 0 || enabled) {
      budgets.push({ category, limit, enabled });
    }
    
    updateSettings({ categoryBudgets: budgets });
  }, [settings.categoryBudgets, updateSettings]);

  const getCategoryBudget = useCallback((category: string): CategoryBudget | undefined => {
    return settings.categoryBudgets.find(b => b.category === category);
  }, [settings.categoryBudgets]);

  const toggleMonthlyComparison = useCallback((enabled: boolean) => {
    updateSettings({ showMonthlyComparison: enabled });
  }, [updateSettings]);

  const setDefaultPaymentMethod = useCallback((method: string) => {
    updateSettings({ defaultPaymentMethod: method });
  }, [updateSettings]);

  const toggleWeeklyReport = useCallback((enabled: boolean) => {
    updateSettings({ weeklyReportEnabled: enabled });
  }, [updateSettings]);

  const setWeeklyReportDay = useCallback((day: number) => {
    updateSettings({ weeklyReportDay: day });
  }, [updateSettings]);

  const toggleHideSmallTransactions = useCallback((enabled: boolean) => {
    updateSettings({ hideSmallTransactions: enabled });
  }, [updateSettings]);

  const setSmallTransactionThreshold = useCallback((threshold: number) => {
    updateSettings({ smallTransactionThreshold: threshold });
  }, [updateSettings]);

  const toggleQuickAdd = useCallback((enabled: boolean) => {
    updateSettings({ quickAddEnabled: enabled });
  }, [updateSettings]);

  const setQuickAddAmount = useCallback((amount: number) => {
    updateSettings({ quickAddAmount: amount });
  }, [updateSettings]);

  // Calculate round up amount for a given price
  const calculateRoundUp = useCallback((amount: number): number => {
    if (!settings.roundUpSavings) return 0;
    const roundTo = settings.roundUpAmount;
    const rounded = Math.ceil(amount / roundTo) * roundTo;
    return rounded - amount;
  }, [settings.roundUpSavings, settings.roundUpAmount]);

  // Format date according to settings
  const formatDate = useCallback((date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch (settings.dateFormat) {
      case 'MM/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }, [settings.dateFormat]);

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
    setSoundVolume,
    updateSettings,
    resetData,
    isBiometricAvailable,
    registerBiometric,
    verifyBiometric,
    disableBiometric,
    // New functions
    setDailySpendingLimit,
    toggleRoundUpSavings,
    setRoundUpAmount,
    setDateFormat,
    setFirstDayOfWeek,
    setCategoryBudget,
    getCategoryBudget,
    toggleMonthlyComparison,
    setDefaultPaymentMethod,
    toggleWeeklyReport,
    setWeeklyReportDay,
    toggleHideSmallTransactions,
    setSmallTransactionThreshold,
    toggleQuickAdd,
    setQuickAddAmount,
    calculateRoundUp,
    formatDate,
  };
}
