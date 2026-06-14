import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, LANGUAGES } from '@/hooks/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Sun,
  Moon,
  Lock,
  Bell,
  Trash2,
  Shield,
  Palette,
  DollarSign,
  AlertTriangle,
  Fingerprint,
  Settings2,
  Eye,
  Clock,
  Volume2,
  Vibrate,
  Database,
  BarChart3,
  History,
  RefreshCw,
  Calendar,
  PiggyBank,
  Wallet,
  Target,
  CreditCard,
  TrendingUp,
  Zap,
  Globe,
  User,
  Mail,
  EyeOff,
  Type,
  Sparkles,
  KeyRound,
  Download,
  Upload,
  Plus,
  X,
} from 'lucide-react';

import { useSettings, Currency, currencyNames, dateFormatLabels, DateFormat, FirstDayOfWeek, ACCENT_PRESETS } from '@/hooks/useSettings';
import { CATEGORY_CONFIG, CategoryType, PAYMENT_METHODS, PaymentMethod } from '@/types/finance';
import { useNotifications } from '@/hooks/useNotifications';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useFeedback } from '@/hooks/useFeedback';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { GlassCard } from './GlassCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOCALE_MAP: Record<string, string> = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useSettings();
  const financeStore = useFinanceStore();
  const { signOut, isGuest, isAuthenticated, exitGuestMode } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const notifications = useNotifications({
    notificationsEnabled: settings.notificationsEnabled,
    dailyReminder: settings.dailyReminder,
    spendingAlerts: settings.spendingAlerts,
    goalAlerts: settings.goalAlerts,
    spendingLimit: settings.spendingLimit,
  });
  
  const dataStats = financeStore.getDataStats();
  const locale = LOCALE_MAP[language] || 'it-IT';
  const pushNotifications = usePushNotifications();
  const previewFeedback = useFeedback({
    soundEnabled: true,
    hapticEnabled: settings.hapticEnabled,
    soundVolume: settings.soundVolume,
  });
  
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const customCats = useCustomCategories();
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🏷️');
  const [newCatColor, setNewCatColor] = useState('#888888');
  const [importingFile, setImportingFile] = useState(false);

  const handleExportJson = () => {
    try {
      const json = financeStore.exportDataJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notifications.sendToast('✅ Backup', t('settings.exportJson'), 'success');
    } catch {
      notifications.sendToast(t('settings.error'), '', 'error');
    }
  };

  const handleImportJson = async (file: File) => {
    setImportingFile(true);
    try {
      const text = await file.text();
      const ok = financeStore.importDataJson(text);
      if (ok) {
        notifications.sendToast('✅', t('settings.importSuccess'), 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        notifications.sendToast(t('settings.error'), t('settings.importError'), 'error');
      }
    } finally {
      setImportingFile(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      notifications.sendToast(t('settings.passwordResetSent'), t('settings.passwordResetDesc'), 'success');
    } catch {
      notifications.sendToast(t('settings.error'), '', 'error');
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      notifications.sendToast('✅', t('settings.signedOutAll'), 'success');
      setTimeout(() => signOut(), 500);
    } catch {
      notifications.sendToast(t('settings.error'), '', 'error');
    }
  };


  useEffect(() => {
    const checkBiometric = async () => {
      const available = await settings.isBiometricAvailable();
      setBiometricAvailable(available);
    };
    checkBiometric();
  }, [settings.isBiometricAvailable]);

  const handleSetPin = () => {
    if (newPin.length !== 6) {
      setPinError(t('settings.pinMustBe6'));
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('settings.pinsDontMatch'));
      return;
    }
    settings.setPin(newPin);
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleRemovePin = () => {
    settings.setPin(null);
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      setBiometricLoading(true);
      try {
        const success = await settings.registerBiometric();
        if (!success) {
          console.error('Failed to register biometric');
        }
      } finally {
        setBiometricLoading(false);
      }
    } else {
      settings.disableBiometric();
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notifications.requestPermission();
      if (granted) {
        settings.toggleNotifications(true);
        notifications.sendToast(t('settings.notificationsEnabled'), t('settings.willReceiveUpdates'));
      } else {
        notifications.sendToast(t('settings.permissionDenied'), t('settings.enableFromBrowser'), 'warning');
      }
    } else {
      settings.toggleNotifications(false);
    }
  };

  const currencyOptions: { value: Currency; label: string; symbol: string }[] = [
    { value: 'EUR', label: t('currency.EUR'), symbol: '€' },
    { value: 'USD', label: t('currency.USD'), symbol: '$' },
    { value: 'GBP', label: t('currency.GBP'), symbol: '£' },
    { value: 'CHF', label: t('currency.CHF'), symbol: 'CHF' },
    { value: 'JPY', label: t('currency.JPY'), symbol: '¥' },
    { value: 'CAD', label: t('currency.CAD'), symbol: 'C$' },
    { value: 'AUD', label: t('currency.AUD'), symbol: 'A$' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md rounded-lg p-3 sm:p-6 bg-card border-border max-h-[92vh] overflow-y-auto overflow-x-hidden [&_*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.language')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    language === lang.code
                      ? 'border-primary bg-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-xs font-medium">{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Guest Account Section - only for guests */}
          {isGuest && (
            <GlassCard className="p-4 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('settings.guestMode')}</h3>
                  <p className="text-sm text-muted-foreground">{t('settings.guestModeDesc')}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('settings.guestWarningData')}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  exitGuestMode();
                  onOpenChange(false);
                  navigate('/auth');
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                {t('settings.registerOrLogin')}
              </Button>
            </GlassCard>
          )}

          {/* Theme & Accent Color Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.appearance')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.customizeTheme')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => settings.setTheme('dark')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  settings.theme === 'dark'
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">{t('settings.dark')}</span>
              </button>
              <button
                onClick={() => settings.setTheme('light')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  settings.theme === 'light'
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="font-medium">{t('settings.light')}</span>
              </button>
            </div>

            {/* Accent color picker */}
            <div>
              <Label className="text-sm mb-3 block">{t('settings.accentColor')}</Label>
              <div className="grid grid-cols-5 gap-3">
                {ACCENT_PRESETS.map((preset) => {
                  const isActive = settings.accentColorId === preset.id;
                  const swatch = `hsl(${preset.hue} ${preset.sat}% ${preset.light}%)`;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        settings.setAccentColor(preset.id);
                        notifications.sendToast(t('settings.accentColorChanged'), preset.name);
                      }}
                      className={`aspect-square rounded-2xl relative transition-all ${
                        isActive ? 'scale-110 ring-2 ring-foreground/80 ring-offset-2 ring-offset-background' : 'hover:scale-105'
                      }`}
                      style={{
                        background: `radial-gradient(circle at 35% 30%, hsl(${preset.hue} ${preset.sat}% ${Math.min(preset.light + 15, 75)}%), ${swatch})`,
                        boxShadow: `0 4px 14px hsl(${preset.hue} ${preset.sat}% ${preset.light}% / 0.45)`,
                      }}
                      aria-label={preset.name}
                      title={preset.name}
                    >
                      {isActive && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* Currency Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.currency')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.selectCurrency')}</p>
              </div>
            </div>
            
            <Select
              value={settings.currency}
              onValueChange={(value: Currency) => {
                settings.setCurrency(value);
                notifications.sendToast(t('settings.currencyChanged'), t('settings.nowUsing', { currency: t(`currency.${value}`) }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.symbol} {option.label} ({option.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </GlassCard>

          {/* Budget & Spending Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.budgetLimits')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.controlExpenses')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>{t('settings.dailyLimit')}</Label>
                      <p className="text-xs text-muted-foreground">{t('settings.alertWhenExceeded')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {settings.dailySpendingLimit > 0 ? `${settings.currencySymbol}${settings.dailySpendingLimit}` : t('settings.disabled')}
                  </span>
                </div>
                <Slider
                  value={[settings.dailySpendingLimit]}
                  onValueChange={([value]) => settings.setDailySpendingLimit(value)}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>{t('settings.roundUpSavings')}</Label>
                      <p className="text-xs text-muted-foreground">{t('settings.roundUpDesc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.roundUpSavings}
                    onCheckedChange={settings.toggleRoundUpSavings}
                  />
                </div>
                
                {settings.roundUpSavings && (
                  <div className="pl-6 space-y-2">
                    <Label className="text-sm">{t('settings.roundTo')}</Label>
                    <div className="flex gap-2">
                      {[1, 5, 10].map((amount) => (
                        <Button
                          key={amount}
                          variant={settings.roundUpAmount === amount ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => settings.setRoundUpAmount(amount)}
                        >
                          {settings.currencySymbol}{amount}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.roundUpExample', {
                        original: '7.30',
                        rounded: String(7.30 + settings.calculateRoundUp(7.30)),
                        saved: settings.calculateRoundUp(7.30).toFixed(2),
                      })}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <Label>{t('settings.defaultPayment')}</Label>
                </div>
                <Select
                  value={settings.defaultPaymentMethod}
                  onValueChange={settings.setDefaultPaymentMethod}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS).map(([key, { label, emoji }]) => (
                      <SelectItem key={key} value={key}>
                        {emoji} {t(`pay.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.quickActions')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.speedUpEntry')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.quickAdd')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.quickAddDesc')}</p>
                </div>
                <Switch
                  checked={settings.quickAddEnabled}
                  onCheckedChange={settings.toggleQuickAdd}
                />
              </div>

              {settings.quickAddEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm">{t('settings.defaultAmount')}</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.quickAddAmount]}
                      onValueChange={([value]) => settings.setQuickAddAmount(value)}
                      min={5}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16 text-right">
                      {settings.currencySymbol}{settings.quickAddAmount}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.hideSmall')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.hideSmallDesc')}</p>
                </div>
                <Switch
                  checked={settings.hideSmallTransactions}
                  onCheckedChange={settings.toggleHideSmallTransactions}
                />
              </div>

              {settings.hideSmallTransactions && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm">{t('settings.minThreshold')}</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.smallTransactionThreshold]}
                      onValueChange={([value]) => settings.setSmallTransactionThreshold(value)}
                      min={1}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16 text-right">
                      {settings.currencySymbol}{settings.smallTransactionThreshold}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Date & Format Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.dateFormat')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.customizeDates')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.dateFormatLabel')}</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value: DateFormat) => settings.setDateFormat(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dateFormatLabels).map(([format, label]) => (
                      <SelectItem key={format} value={format}>
                        {t(`dateFormat.${format}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.firstDayOfWeek')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={settings.firstDayOfWeek === 'monday' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => settings.setFirstDayOfWeek('monday')}
                  >
                    {t('settings.monday')}
                  </Button>
                  <Button
                    variant={settings.firstDayOfWeek === 'sunday' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => settings.setFirstDayOfWeek('sunday')}
                  >
                    {t('settings.sunday')}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.monthlyComparison')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.monthlyComparisonDesc')}</p>
                </div>
                <Switch
                  checked={settings.showMonthlyComparison}
                  onCheckedChange={settings.toggleMonthlyComparison}
                />
              </div>
            </div>
          </GlassCard>

          {/* Display Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-info" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.display')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.customizeDisplay')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.compactView')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.showMore')}</p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={settings.toggleCompactView}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.showDecimals')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.decimalExample')}</p>
                </div>
                <Switch
                  checked={settings.showDecimals}
                  onCheckedChange={settings.toggleShowDecimals}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>{t('settings.sounds')}</Label>
                      <p className="text-xs text-muted-foreground">{t('settings.soundFeedback')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={settings.toggleSound}
                  />
                </div>

                {settings.soundEnabled && (
                  <div className="pl-6 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{t('settings.soundVolume')}</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(settings.soundVolume * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[Math.round(settings.soundVolume * 100)]}
                        onValueChange={([v]) => settings.setSoundVolume(v / 100)}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['tap', 'success', 'notification'] as const).map((kind) => (
                        <Button
                          key={kind}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => previewFeedback.trigger(kind)}
                        >
                          {t(kind === 'tap' ? 'settings.tapSound' : kind === 'success' ? 'settings.successSound' : 'settings.notificationSound')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>{t('settings.vibrations')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.hapticFeedback')}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.hapticEnabled}
                  onCheckedChange={settings.toggleHaptic}
                />
              </div>
            </div>
          </GlassCard>

          {/* Security Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.security')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.protectData')}</p>
              </div>
            </div>

            {!showPinSetup ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <Label>{t('settings.pinLock')}</Label>
                  </div>
                  <Switch
                    checked={settings.pinEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setShowPinSetup(true);
                      } else {
                        handleRemovePin();
                      }
                    }}
                  />
                </div>
                
                {settings.pinEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPinSetup(true)}
                    className="w-full"
                  >
                    {t('settings.changePin')}
                  </Button>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>{t('settings.faceId')}</Label>
                      {!biometricAvailable && (
                        <p className="text-xs text-muted-foreground">{t('settings.notAvailable')}</p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={settings.biometricEnabled}
                    onCheckedChange={handleToggleBiometric}
                    disabled={!biometricAvailable || biometricLoading}
                  />
                </div>

                {settings.biometricEnabled && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t('settings.faceIdActive')}
                  </p>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Label>{t('settings.autoLock')}</Label>
                  </div>
                  <Select
                    value={String(settings.autoLockTimeout)}
                    onValueChange={(value) => settings.setAutoLockTimeout(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('settings.disabled')}</SelectItem>
                      <SelectItem value="1">{t('settings.minute')}</SelectItem>
                      <SelectItem value="5">{t('settings.minutes', { n: '5' })}</SelectItem>
                      <SelectItem value="15">{t('settings.minutes', { n: '15' })}</SelectItem>
                      <SelectItem value="30">{t('settings.minutes', { n: '30' })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.newPin')}</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.confirmPin')}</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                  />
                </div>
                {pinError && (
                  <p className="text-destructive text-sm">{pinError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPinSetup(false);
                      setNewPin('');
                      setConfirmPin('');
                      setPinError('');
                    }}
                    className="flex-1"
                  >
                    {t('settings.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSetPin}
                    className="flex-1"
                  >
                    {t('settings.savePin')}
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Notifications Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.notifications')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.manageNotifications')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('settings.notificationsActive')}</Label>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>

              {settings.notificationsEnabled && isAuthenticated && !isGuest && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.pushNotifications')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {pushNotifications.isSupported 
                          ? t('settings.pushNotificationsDesc')
                          : t('settings.pushNotAvailable')}
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications.isSubscribed}
                      disabled={!pushNotifications.isSupported}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          const result = await pushNotifications.subscribe();
                          if (result.success) {
                            notifications.sendToast(t('settings.pushEnabled'), t('settings.pushEnabledDesc'), 'success');
                          } else if (result.reason === 'iframe') {
                            notifications.sendToast(t('settings.pushError'), t('settings.pushIframeError'), 'warning');
                          } else if (result.reason === 'permission_denied') {
                            notifications.sendToast(t('settings.pushError'), t('settings.pushPermissionDenied'), 'error');
                          } else {
                            notifications.sendToast(t('settings.pushError'), t('settings.pushErrorDesc'), 'error');
                          }
                        } else {
                          await pushNotifications.unsubscribe();
                          notifications.sendToast(t('settings.pushDisabled'), '', 'info');
                        }
                      }}
                    />
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.dailyReminder')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.dailyReminderDesc')}</p>
                </div>
                <Switch
                  checked={settings.dailyReminder}
                  onCheckedChange={settings.toggleDailyReminder}
                  disabled={!settings.notificationsEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.spendingAlerts')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.spendingAlertsDesc')}</p>
                </div>
                <Switch
                  checked={settings.spendingAlerts}
                  onCheckedChange={settings.toggleSpendingAlerts}
                  disabled={!settings.notificationsEnabled}
                />
              </div>

              {settings.spendingAlerts && settings.notificationsEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm">{t('settings.monthlySpendingLimit')}</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.spendingLimit]}
                      onValueChange={([value]) => settings.setSpendingLimit(value)}
                      min={100}
                      max={5000}
                      step={100}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-20 text-right">
                      {settings.currencySymbol}{settings.spendingLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.savingsGoals')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.savingsGoalsDesc')}</p>
                </div>
                <Switch
                  checked={settings.goalAlerts}
                  onCheckedChange={settings.toggleGoalAlerts}
                  disabled={!settings.notificationsEnabled}
                />
              </div>
            </div>
          </GlassCard>

          {/* Data Statistics Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.dataStats')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.dataOverview')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass-input rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-primary">{dataStats.transactionCount}</p>
                <p className="text-muted-foreground text-xs">{t('settings.transactionsCount')}</p>
              </div>
              <div className="glass-input rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-success">{dataStats.goalsCount}</p>
                <p className="text-muted-foreground text-xs">{t('settings.goalsCount')}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              {dataStats.oldestTransaction && (
                <div className="flex justify-between">
                  <span>{t('settings.firstTransaction')}</span>
                  <span>{dataStats.oldestTransaction.toLocaleDateString(locale)}</span>
                </div>
              )}
              {dataStats.lastUpdated && (
                <div className="flex justify-between">
                  <span>{t('settings.lastUpdate')}</span>
                  <span>{dataStats.lastUpdated.toLocaleString(locale)}</span>
                </div>
              )}
              {dataStats.lastBackup && (
                <div className="flex justify-between">
                  <span>{t('settings.lastBackup')}</span>
                  <span>{dataStats.lastBackup.toLocaleString(locale)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('settings.dataVersion')}</span>
                <span>v{dataStats.dataVersion}</span>
              </div>
            </div>
          </GlassCard>

          {/* Advanced Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Database className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.dataManagement')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.backupRestore')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  financeStore.createManualBackup();
                  notifications.sendToast(t('settings.backupCreated'), t('settings.dataSafe'), 'success');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('settings.createBackup')}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const data = localStorage.getItem('finance_data');
                  if (data) {
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cashow-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    notifications.sendToast(t('settings.backupDownloaded'), t('settings.dataExported'), 'success');
                  }
                }}
              >
                {t('settings.exportData')}
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const data = JSON.parse(event.target?.result as string);
                          localStorage.setItem('finance_data', JSON.stringify(data));
                          notifications.sendToast(t('settings.dataImported'), t('settings.reloading'), 'success');
                          setTimeout(() => window.location.reload(), 1500);
                        } catch {
                          notifications.sendToast(t('settings.error'), t('settings.invalidFile'), 'error');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              >
                {t('settings.importData')}
              </Button>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-warning">
                    <History className="w-4 h-4 mr-2" />
                    {t('settings.restoreAutoBackup')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.restoreAutoBackupTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.restoreAutoBackupDesc')}
                      {dataStats.lastBackup && (
                        <span className="block mt-2 font-medium">
                          {t('settings.backupDate', { date: dataStats.lastBackup.toLocaleString(locale) })}
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const success = financeStore.restoreFromBackup();
                        if (success) {
                          notifications.sendToast(t('settings.restored'), t('settings.dataRecovered'), 'success');
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          notifications.sendToast(t('settings.error'), t('settings.noBackup'), 'error');
                        }
                      }}
                    >
                      {t('settings.restore')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </GlassCard>

          {/* Selective Clear Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.selectiveClean')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.deleteWhatYouWant')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('settings.deleteTransactionsOnly')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.deleteTransactionsTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.deleteTransactionsDesc', { count: String(dataStats.transactionCount) })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        financeStore.clearTransactions();
                        notifications.sendToast(t('settings.transactionsDeleted'), t('settings.autoBackupCreated'), 'success');
                      }}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      {t('settings.deleteTransactionsOnly')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('settings.deleteGoalsOnly')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.deleteGoalsTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.deleteGoalsDesc', { count: String(dataStats.goalsCount) })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        financeStore.clearGoals();
                        notifications.sendToast(t('settings.goalsDeleted'), t('settings.autoBackupCreated'), 'success');
                      }}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      {t('settings.deleteGoalsOnly')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard className="p-4 border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">{t('settings.dangerZone')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.irreversibleActions')}</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.deleteAllData')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.deleteAllDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={settings.resetData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('settings.deleteAll')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GlassCard>

          {/* ===== Advanced — Privacy ===== */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.privacyMode')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.privacyModeDesc')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label className="flex-1">{t('settings.privacyMode')}</Label>
                <Switch
                  checked={settings.privacyMode}
                  onCheckedChange={(v) => settings.updateSettings({ privacyMode: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.blurOnBlur')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.blurOnBlurDesc')}</p>
                </div>
                <Switch
                  checked={settings.blurOnBlur}
                  onCheckedChange={(v) => settings.updateSettings({ blurOnBlur: v })}
                />
              </div>
            </div>
          </GlassCard>

          {/* ===== Advanced — Theme ===== */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.advanced')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.advancedDesc')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.amoled')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.amoledDesc')}</p>
                </div>
                <Switch
                  checked={settings.pureBlackAmoled}
                  onCheckedChange={(v) => settings.updateSettings({ pureBlackAmoled: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.highContrast')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.highContrastDesc')}</p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(v) => settings.updateSettings({ highContrast: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.reducedMotion')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.reducedMotionDesc')}</p>
                </div>
                <Switch
                  checked={settings.reducedMotion}
                  onCheckedChange={(v) => settings.updateSettings({ reducedMotion: v })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    <Label>{t('settings.textSize')}</Label>
                  </div>
                  <span className="text-sm font-medium">{Math.round(settings.textScale * 100)}%</span>
                </div>
                <Slider
                  value={[settings.textScale]}
                  onValueChange={([v]) => settings.updateSettings({ textScale: v })}
                  min={0.85}
                  max={1.3}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">{t('settings.textSizeDesc')}</p>
              </div>
            </div>
          </GlassCard>

          {/* ===== Gestures & Shortcuts ===== */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.gestures')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.gesturesDesc')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.swipeToDelete')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.swipeToDeleteDesc')}</p>
                </div>
                <Switch
                  checked={settings.swipeToDeleteEnabled}
                  onCheckedChange={(v) => settings.updateSettings({ swipeToDeleteEnabled: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.shakeToUndo')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.shakeToUndoDesc')}</p>
                </div>
                <Switch
                  checked={settings.shakeToUndoEnabled}
                  onCheckedChange={(v) => settings.updateSettings({ shakeToUndoEnabled: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.keyboardShortcuts')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.keyboardShortcutsDesc')}</p>
                </div>
                <Switch
                  checked={settings.keyboardShortcutsEnabled}
                  onCheckedChange={(v) => settings.updateSettings({ keyboardShortcutsEnabled: v })}
                />
              </div>
            </div>
          </GlassCard>

          {/* ===== Smart Notifications ===== */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.smartNotif')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.smartNotifDesc')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.weeklyDigest')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.weeklyDigestDesc')}</p>
                </div>
                <Switch
                  checked={settings.weeklyDigestEnabled}
                  onCheckedChange={(v) => settings.updateSettings({ weeklyDigestEnabled: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.categoryAlerts')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.categoryAlertsDesc')}</p>
                </div>
                <Switch
                  checked={settings.categoryAlertsEnabled}
                  onCheckedChange={(v) => settings.updateSettings({ categoryAlertsEnabled: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>{t('settings.recurringBills')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.recurringBillsDesc')}</p>
                </div>
                <Switch
                  checked={settings.recurringBillsReminder}
                  onCheckedChange={(v) => settings.updateSettings({ recurringBillsReminder: v })}
                />
              </div>
            </div>
          </GlassCard>

          {/* ===== Custom Categories ===== */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.customCategories')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.customCategoriesDesc')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {customCats.categories.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">{t('settings.noCustomCategories')}</p>
              )}
              {customCats.categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <span className="text-xl">{c.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <span className="w-4 h-4 rounded-full" style={{ background: c.color }} />
                  <Button size="icon" variant="ghost" onClick={() => customCats.removeCategory(c.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="grid grid-cols-[60px_60px_1fr_auto] gap-2 items-center">
                <Input
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value.slice(0, 2))}
                  className="text-center"
                  placeholder="🏷️"
                />
                <Input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="p-1 h-10"
                />
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={t('settings.categoryName')}
                  maxLength={30}
                />
                <Button
                  size="icon"
                  disabled={!newCatName.trim()}
                  onClick={() => {
                    customCats.addCategory({ name: newCatName.trim(), emoji: newCatEmoji || '🏷️', color: newCatColor, keywords: [] });
                    setNewCatName('');
                    setNewCatEmoji('🏷️');
                    setNewCatColor('#888888');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* ===== Backup JSON ===== */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.fullBackupRestore')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.fullBackupRestoreDesc')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleExportJson}>
                <Download className="w-4 h-4 mr-2" />
                {t('settings.exportJson')}
              </Button>
              <label className="block">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportJson(f);
                    e.target.value = '';
                  }}
                />
                <Button asChild variant="outline" className="w-full justify-start" disabled={importingFile}>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('settings.importJson')}
                  </span>
                </Button>
              </label>
            </div>
          </GlassCard>

          {/* ===== Profile & Security ===== */}
          {isAuthenticated && !isGuest && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('settings.profileSecurity')}</h3>
                  <p className="text-sm text-muted-foreground">{t('settings.profileSecurityDesc')}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handlePasswordReset}>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {t('settings.changePassword')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-warning">
                      <Lock className="w-4 h-4 mr-2" />
                      {t('settings.signOutAllDevices')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.signOutAllDevices')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('settings.signedOutAll')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOutAllDevices}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </GlassCard>
          )}

          {/* Beta features section removed — was unused noise */}


          {/* Privacy & Security Info */}
          <GlassCard className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.dataProtected')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.encryption')}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary shrink-0" />
                <span>{t('settings.encryptedAtRest')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-primary shrink-0" />
                <span>{t('settings.rlsIsolation')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-primary shrink-0" />
                <span>{t('settings.noThirdParty')}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate('/privacy');
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              {t('settings.readPrivacy')}
            </Button>
          </GlassCard>

          {/* Account Deletion - only for authenticated users */}
          {isAuthenticated && !isGuest && (
          <GlassCard className="p-4 border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">{t('settings.deleteAccount')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.deleteAccountDesc')}</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={deletingAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deletingAccount ? t('settings.deleting') : t('settings.deleteMyAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.deleteAccountTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.deleteAccountWarning')}
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{t('settings.allTransactions')}</li>
                      <li>{t('settings.allGoals')}</li>
                      <li>{t('settings.yourProfile')}</li>
                      <li>{t('settings.yourLoginAccount')}</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      setDeletingAccount(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) throw new Error('No session');

                        const { error } = await supabase.functions.invoke('delete-account', {
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        });

                        if (error) throw error;

                        notifications.sendToast(t('settings.accountDeleted'), t('settings.allDataDeleted'), 'success');
                        localStorage.clear();
                        setTimeout(() => {
                          signOut();
                        }, 1500);
                      } catch (err) {
                        console.error('Error deleting account:', err);
                        notifications.sendToast(t('settings.deleteError'), t('settings.cantDeleteAccount'), 'error');
                        setDeletingAccount(false);
                      }
                    }}
                  >
                    {t('settings.yesDeleteAll')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GlassCard>
          )}


          {/* Feedback & Support */}
          <GlassCard className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('settings.feedbackTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.feedbackDesc')}</p>
              </div>
            </div>
            <a
              href="https://mail.google.com/mail/?view=cm&to=jacopo.dev0@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-muted-foreground mr-1">{t('settings.emailUs')}</span>
                <span className="font-medium">jacopo.dev0@gmail.com</span>
              </Button>
            </a>
          </GlassCard>

          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Cashow v1.0.0</p>
            <p className="text-xs mt-1">Made with ❤️</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
