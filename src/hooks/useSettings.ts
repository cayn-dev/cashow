import { useState, useEffect, useCallback } from 'react';
import type { SalaryFrequency } from '@/lib/salary';


export type Theme = 'dark' | 'light';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD';
export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
export type FirstDayOfWeek = 'monday' | 'sunday';

// Accent color presets — name + HSL hue + saturation + lightness
export interface AccentPreset {
  id: string;
  name: string;
  hue: number;
  sat: number;
  light: number;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'mono',    name: 'Monochrome',  hue: 0,   sat: 0,   light: 100 },
  { id: 'blue',    name: 'Apple Blue',  hue: 211, sat: 100, light: 55 },
  { id: 'indigo',  name: 'Indigo',      hue: 240, sat: 80,  light: 65 },
  { id: 'purple',  name: 'Purple',      hue: 280, sat: 75,  light: 62 },
  { id: 'pink',    name: 'Pink',        hue: 330, sat: 85,  light: 65 },
  { id: 'red',     name: 'Red',         hue: 0,   sat: 75,  light: 58 },
  { id: 'orange',  name: 'Orange',      hue: 25,  sat: 95,  light: 58 },
  { id: 'yellow',  name: 'Yellow',      hue: 45,  sat: 95,  light: 58 },
  { id: 'green',   name: 'Green',       hue: 142, sat: 70,  light: 50 },
  { id: 'teal',    name: 'Teal',        hue: 175, sat: 75,  light: 50 },
];

// Budget per category
export interface CategoryBudget {
  category: string;
  limit: number;
  enabled: boolean;
}

interface Settings {
  theme: Theme;
  accentColorId: string; // matches AccentPreset.id
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
  autoLockTimeout: number;
  compactView: boolean;
  showDecimals: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  soundVolume: number;
  dailySpendingLimit: number;
  dailySpendingAlerts: boolean;
  roundUpSavings: boolean;
  roundUpAmount: number;
  dateFormat: DateFormat;
  firstDayOfWeek: FirstDayOfWeek;
  categoryBudgets: CategoryBudget[];
  // Salary configuration
  salaryAmount: number;              // raw amount entered by the user
  salaryFrequency: SalaryFrequency;  // weekly | monthly | yearly
  salaryIsGross: boolean;            // whether the amount entered is gross
  // Overall monthly spending cap (independent from category budgets)
  monthlySpendingLimit: number;
  monthlyLimitHistory: Record<string, number>; // 'YYYY-MM' -> limit
  // Dashboard customisation
  dashboardWidgets: string[];        // ordered widget ids ([] = default order)
  dashboardHiddenWidgets: string[];  // hidden widget ids

  showMonthlyComparison: boolean;
  defaultPaymentMethod: string;
  weeklyReportEnabled: boolean;
  weeklyReportDay: number;
  hideSmallTransactions: boolean;
  smallTransactionThreshold: number;
  quickAddEnabled: boolean;
  quickAddAmount: number;
  // ==== Advanced ====
  // Privacy
  privacyMode: boolean;        // hide amounts globally
  blurOnBlur: boolean;         // blur sensitive UI when window loses focus
  hideOnScreenshot: boolean;   // attempt blur during screen capture
  // Theme advanced
  pureBlackAmoled: boolean;    // even darker surfaces
  highContrast: boolean;       // stronger borders & text
  textScale: number;           // 0.85 - 1.3
  reducedMotion: boolean;
  // Gestures
  swipeToDeleteEnabled: boolean;
  shakeToUndoEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  // Smart notifications
  weeklyDigestEnabled: boolean;
  categoryAlertsEnabled: boolean;
  recurringBillsReminder: boolean;
  // Beta / experiments
  betaFeaturesEnabled: boolean;
  experimentalAI: boolean;
  experimentalCharts: boolean;
}

const SETTINGS_KEY = 'finance_settings';
const PIN_VERIFIED_KEY = 'pin_verified';
const PIN_SALT = 'cashow:v1:pin';

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
  accentColorId: 'mono',
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
  salaryAmount: 0,
  salaryFrequency: 'monthly',
  salaryIsGross: false,
  monthlySpendingLimit: 0,
  monthlyLimitHistory: {},
  dashboardWidgets: [],
  dashboardHiddenWidgets: [],

  showMonthlyComparison: true,
  defaultPaymentMethod: 'card',
  weeklyReportEnabled: false,
  weeklyReportDay: 1, // Monday
  hideSmallTransactions: false,
  smallTransactionThreshold: 1,
  quickAddEnabled: true,
  quickAddAmount: 10,
  // Advanced defaults
  privacyMode: false,
  blurOnBlur: false,
  hideOnScreenshot: false,
  pureBlackAmoled: true,
  highContrast: false,
  textScale: 1,
  reducedMotion: false,
  swipeToDeleteEnabled: true,
  shakeToUndoEnabled: false,
  keyboardShortcutsEnabled: true,
  weeklyDigestEnabled: false,
  categoryAlertsEnabled: true,
  recurringBillsReminder: true,
  betaFeaturesEnabled: false,
  experimentalAI: false,
  experimentalCharts: false,
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
        // Lock if PIN is enabled (supports both legacy 6-digit and SHA-256 hashed PINs) OR biometric is enabled
        const hasPinLock = parsed.pinEnabled === true && !!parsed.pin && typeof parsed.pin === 'string';
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

  // Apply accent color → updates --primary, --primary-glow, --accent, --ring
  useEffect(() => {
    const preset = ACCENT_PRESETS.find(p => p.id === settings.accentColorId) ?? ACCENT_PRESETS[0];
    const root = document.documentElement;
    const isLight = settings.theme === 'light';
    if (preset.id === 'mono') {
      // Monochrome: white on dark, black on light
      const base = isLight ? '0 0% 10%' : '0 0% 100%';
      const fg = isLight ? '0 0% 100%' : '0 0% 0%';
      const glow = isLight ? '0 0% 25%' : '0 0% 90%';
      root.style.setProperty('--primary', base);
      root.style.setProperty('--primary-foreground', fg);
      root.style.setProperty('--primary-glow', glow);
      root.style.setProperty('--ring', base);
      root.style.setProperty('--info', base);
      root.style.setProperty('--accent', base);
      root.style.setProperty('--accent-foreground', fg);
    } else {
      const base = `${preset.hue} ${preset.sat}% ${preset.light}%`;
      const glow = `${preset.hue} ${preset.sat}% ${Math.min(preset.light + 10, 75)}%`;
      root.style.setProperty('--primary', base);
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--primary-glow', glow);
      root.style.setProperty('--ring', base);
      root.style.setProperty('--info', base);
      root.style.setProperty('--accent', base);
      root.style.setProperty('--accent-foreground', '0 0% 100%');
    }
  }, [settings.accentColorId, settings.theme]);

  // Apply advanced visual flags
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('privacy-mode', settings.privacyMode);
    root.classList.toggle('amoled', settings.pureBlackAmoled && settings.theme === 'dark');
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.style.setProperty('--text-scale', String(settings.textScale));
  }, [settings.privacyMode, settings.pureBlackAmoled, settings.highContrast, settings.reducedMotion, settings.textScale, settings.theme]);

  useEffect(() => {
    if (!settings.blurOnBlur) {
      document.documentElement.classList.remove('app-blurred');
      return;
    }
    const onBlur = () => document.documentElement.classList.add('app-blurred');
    const onFocus = () => document.documentElement.classList.remove('app-blurred');
    const onVis = () => { if (document.hidden) onBlur(); else onFocus(); };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [settings.blurOnBlur]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      if (updates.currency) {
        newSettings.currencySymbol = currencySymbols[updates.currency];
      }
      return newSettings;
    });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    updateSettings({ theme });
  }, [updateSettings]);

  const setAccentColor = useCallback((accentColorId: string) => {
    updateSettings({ accentColorId });
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
            name: 'Cashow',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: 'user@cashow.app',
            displayName: 'Cashow User',
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

  // ===== Salary configuration (amount + frequency + net/gross) =====
  const setSalaryConfig = useCallback(
    (config: { amount?: number; frequency?: SalaryFrequency; isGross?: boolean }) => {
      updateSettings({
        ...(config.amount !== undefined ? { salaryAmount: config.amount } : {}),
        ...(config.frequency !== undefined ? { salaryFrequency: config.frequency } : {}),
        ...(config.isGross !== undefined ? { salaryIsGross: config.isGross } : {}),
      });
    },
    [updateSettings],
  );

  // ===== Overall monthly spending limit (with per-month history) =====
  const setMonthlySpendingLimit = useCallback(
    (limit: number) => {
      const key = monthKey();
      updateSettings({
        monthlySpendingLimit: limit,
        monthlyLimitHistory: { ...settings.monthlyLimitHistory, [key]: limit },
      });
    },
    [updateSettings, settings.monthlyLimitHistory],
  );

  // Keep the current month recorded in the history so past months stay browsable
  useEffect(() => {
    const key = monthKey();
    if (settings.monthlySpendingLimit > 0 && settings.monthlyLimitHistory[key] === undefined) {
      updateSettings({
        monthlyLimitHistory: {
          ...settings.monthlyLimitHistory,
          [key]: settings.monthlySpendingLimit,
        },
      });
    }
  }, [settings.monthlySpendingLimit, settings.monthlyLimitHistory, updateSettings]);

  // ===== Dashboard layout customisation =====
  const setDashboardWidgets = useCallback(
    (widgets: string[]) => updateSettings({ dashboardWidgets: widgets }),
    [updateSettings],
  );

  const setHiddenDashboardWidgets = useCallback(
    (hidden: string[]) => updateSettings({ dashboardHiddenWidgets: hidden }),
    [updateSettings],
  );

  const resetDashboardLayout = useCallback(() => {
    updateSettings({ dashboardWidgets: [], dashboardHiddenWidgets: [] });
  }, [updateSettings]);

  return {
    ...settings,
    isLocked,
    setSalaryConfig,
    setMonthlySpendingLimit,
    setDashboardWidgets,
    setHiddenDashboardWidgets,
    resetDashboardLayout,

    setTheme,
    setAccentColor,
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
