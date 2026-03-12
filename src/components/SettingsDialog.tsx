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
} from 'lucide-react';
import { useSettings, Currency, currencyNames, dateFormatLabels, DateFormat, FirstDayOfWeek } from '@/hooks/useSettings';
import { CATEGORY_CONFIG, CategoryType, PAYMENT_METHODS, PaymentMethod } from '@/types/finance';
import { useNotifications } from '@/hooks/useNotifications';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useSettings();
  const financeStore = useFinanceStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const notifications = useNotifications({
    notificationsEnabled: settings.notificationsEnabled,
    dailyReminder: settings.dailyReminder,
    spendingAlerts: settings.spendingAlerts,
    goalAlerts: settings.goalAlerts,
    spendingLimit: settings.spendingLimit,
  });
  
  const dataStats = financeStore.getDataStats();
  
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await settings.isBiometricAvailable();
      setBiometricAvailable(available);
    };
    checkBiometric();
  }, [settings.isBiometricAvailable]);

  const handleSetPin = () => {
    if (newPin.length !== 6) {
      setPinError('Il PIN deve avere esattamente 6 cifre');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('I PIN non coincidono');
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
        notifications.sendToast('🔔 Notifiche attivate', 'Riceverai aggiornamenti importanti');
      } else {
        notifications.sendToast('⚠️ Permesso negato', 'Abilita le notifiche dal browser', 'warning');
      }
    } else {
      settings.toggleNotifications(false);
    }
  };

  const currencyOptions: { value: Currency; label: string; symbol: string }[] = [
    { value: 'EUR', label: currencyNames.EUR, symbol: '€' },
    { value: 'USD', label: currencyNames.USD, symbol: '$' },
    { value: 'GBP', label: currencyNames.GBP, symbol: '£' },
    { value: 'CHF', label: currencyNames.CHF, symbol: 'CHF' },
    { value: 'JPY', label: currencyNames.JPY, symbol: '¥' },
    { value: 'CAD', label: currencyNames.CAD, symbol: 'C$' },
    { value: 'AUD', label: currencyNames.AUD, symbol: 'A$' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            ⚙️ Impostazioni
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Aspetto</h3>
                <p className="text-sm text-muted-foreground">Personalizza il tema</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => settings.setTheme('dark')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  settings.theme === 'dark'
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">Scuro</span>
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
                <span className="font-medium">Chiaro</span>
              </button>
            </div>
          </GlassCard>

          {/* Currency Section */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Valuta</h3>
                <p className="text-sm text-muted-foreground">Seleziona la tua valuta</p>
              </div>
            </div>
            
            <Select
              value={settings.currency}
              onValueChange={(value: Currency) => {
                settings.setCurrency(value);
                notifications.sendToast('💱 Valuta cambiata', `Ora usi ${currencyNames[value]}`);
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
                <h3 className="font-semibold">Budget e Limiti</h3>
                <p className="text-sm text-muted-foreground">Controlla le tue spese</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Daily spending limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>Limite giornaliero</Label>
                      <p className="text-xs text-muted-foreground">Avviso quando superi</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {settings.dailySpendingLimit > 0 ? `${settings.currencySymbol}${settings.dailySpendingLimit}` : 'Disattivato'}
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

              {/* Round up savings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>Arrotonda per risparmiare</Label>
                      <p className="text-xs text-muted-foreground">Arrotonda le spese e risparmia la differenza</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.roundUpSavings}
                    onCheckedChange={settings.toggleRoundUpSavings}
                  />
                </div>
                
                {settings.roundUpSavings && (
                  <div className="pl-6 space-y-2">
                    <Label className="text-sm">Arrotonda a:</Label>
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
                      Es: Spesa €7.30 → Arrotondata a €{7.30 + settings.calculateRoundUp(7.30)} (+€{settings.calculateRoundUp(7.30).toFixed(2)} risparmiati)
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Default payment method */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <Label>Metodo di pagamento predefinito</Label>
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
                        {emoji} {label}
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
                <h3 className="font-semibold">Azioni Rapide</h3>
                <p className="text-sm text-muted-foreground">Velocizza l'inserimento</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aggiunta rapida</Label>
                  <p className="text-xs text-muted-foreground">Aggiungi spese con un tap</p>
                </div>
                <Switch
                  checked={settings.quickAddEnabled}
                  onCheckedChange={settings.toggleQuickAdd}
                />
              </div>

              {settings.quickAddEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm">Importo predefinito</Label>
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
                  <Label>Nascondi piccole spese</Label>
                  <p className="text-xs text-muted-foreground">Nascondi transazioni minime</p>
                </div>
                <Switch
                  checked={settings.hideSmallTransactions}
                  onCheckedChange={settings.toggleHideSmallTransactions}
                />
              </div>

              {settings.hideSmallTransactions && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm">Soglia minima</Label>
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
                <h3 className="font-semibold">Data e Formato</h3>
                <p className="text-sm text-muted-foreground">Personalizza le date</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Formato data</Label>
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
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primo giorno della settimana</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={settings.firstDayOfWeek === 'monday' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => settings.setFirstDayOfWeek('monday')}
                  >
                    Lunedì
                  </Button>
                  <Button
                    variant={settings.firstDayOfWeek === 'sunday' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => settings.setFirstDayOfWeek('sunday')}
                  >
                    Domenica
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Confronto mensile</Label>
                  <p className="text-xs text-muted-foreground">Mostra variazioni rispetto al mese scorso</p>
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
                <h3 className="font-semibold">Visualizzazione</h3>
                <p className="text-sm text-muted-foreground">Personalizza la visualizzazione</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Vista compatta</Label>
                  <p className="text-xs text-muted-foreground">Mostra più elementi</p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={settings.toggleCompactView}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostra decimali</Label>
                  <p className="text-xs text-muted-foreground">Es: €100.50 vs €100</p>
                </div>
                <Switch
                  checked={settings.showDecimals}
                  onCheckedChange={settings.toggleShowDecimals}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Suoni</Label>
                    <p className="text-xs text-muted-foreground">Feedback sonoro</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={settings.toggleSound}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label>Vibrazioni</Label>
                    <p className="text-xs text-muted-foreground">Feedback haptic</p>
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
                <h3 className="font-semibold">Sicurezza</h3>
                <p className="text-sm text-muted-foreground">Proteggi i tuoi dati</p>
              </div>
            </div>

            {!showPinSetup ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <Label>Blocco PIN</Label>
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
                    Cambia PIN
                  </Button>
                )}

                <Separator />

                {/* Biometric Authentication */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>Face ID / Touch ID</Label>
                      {!biometricAvailable && (
                        <p className="text-xs text-muted-foreground">Non disponibile su questo dispositivo</p>
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
                    ✓ Face ID / Touch ID attivo
                  </p>
                )}

                <Separator />

                {/* Auto-lock timeout */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Label>Blocco automatico</Label>
                  </div>
                  <Select
                    value={String(settings.autoLockTimeout)}
                    onValueChange={(value) => settings.setAutoLockTimeout(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Disabilitato</SelectItem>
                      <SelectItem value="1">1 minuto</SelectItem>
                      <SelectItem value="5">5 minuti</SelectItem>
                      <SelectItem value="15">15 minuti</SelectItem>
                      <SelectItem value="30">30 minuti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nuovo PIN (6 cifre)</Label>
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
                  <Label>Conferma PIN</Label>
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
                    Annulla
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSetPin}
                    className="flex-1"
                  >
                    Salva PIN
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
                <h3 className="font-semibold">Notifiche</h3>
                <p className="text-sm text-muted-foreground">Gestisci le notifiche</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Notifiche attive</Label>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Promemoria giornaliero</Label>
                  <p className="text-xs text-muted-foreground">Ricordati di registrare le spese (ore 20:00)</p>
                </div>
                <Switch
                  checked={settings.dailyReminder}
                  onCheckedChange={settings.toggleDailyReminder}
                  disabled={!settings.notificationsEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Avvisi spese</Label>
                  <p className="text-xs text-muted-foreground">Quando superi il limite</p>
                </div>
                <Switch
                  checked={settings.spendingAlerts}
                  onCheckedChange={settings.toggleSpendingAlerts}
                  disabled={!settings.notificationsEnabled}
                />
              </div>

              {settings.spendingAlerts && settings.notificationsEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm">Limite mensile spese</Label>
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
                  <Label>Obiettivi risparmi</Label>
                  <p className="text-xs text-muted-foreground">Quando raggiungi un obiettivo</p>
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
                <h3 className="font-semibold">Statistiche Dati</h3>
                <p className="text-sm text-muted-foreground">Panoramica dei tuoi dati</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass-input rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-primary">{dataStats.transactionCount}</p>
                <p className="text-muted-foreground text-xs">Transazioni</p>
              </div>
              <div className="glass-input rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-success">{dataStats.goalsCount}</p>
                <p className="text-muted-foreground text-xs">Obiettivi</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              {dataStats.oldestTransaction && (
                <div className="flex justify-between">
                  <span>Prima transazione:</span>
                  <span>{dataStats.oldestTransaction.toLocaleDateString('it-IT')}</span>
                </div>
              )}
              {dataStats.lastUpdated && (
                <div className="flex justify-between">
                  <span>Ultimo aggiornamento:</span>
                  <span>{dataStats.lastUpdated.toLocaleString('it-IT')}</span>
                </div>
              )}
              {dataStats.lastBackup && (
                <div className="flex justify-between">
                  <span>Ultimo backup:</span>
                  <span>{dataStats.lastBackup.toLocaleString('it-IT')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Versione dati:</span>
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
                <h3 className="font-semibold">Gestione Dati</h3>
                <p className="text-sm text-muted-foreground">Backup e ripristino</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  financeStore.createManualBackup();
                  notifications.sendToast('✅ Backup creato', 'I tuoi dati sono al sicuro', 'success');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Crea Backup Manuale
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
                    a.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    notifications.sendToast('💾 Backup scaricato', 'I tuoi dati sono stati esportati', 'success');
                  }
                }}
              >
                📥 Esporta dati (Backup)
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
                          notifications.sendToast('✅ Dati importati', 'Ricarico la pagina...', 'success');
                          setTimeout(() => window.location.reload(), 1500);
                        } catch {
                          notifications.sendToast('❌ Errore', 'File non valido', 'error');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              >
                📤 Importa dati (Ripristino)
              </Button>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-warning">
                    <History className="w-4 h-4 mr-2" />
                    Ripristina da Backup Automatico
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ripristina backup automatico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questo ripristinerà i dati dall'ultimo backup automatico.
                      {dataStats.lastBackup && (
                        <span className="block mt-2 font-medium">
                          Backup del: {dataStats.lastBackup.toLocaleString('it-IT')}
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const success = financeStore.restoreFromBackup();
                        if (success) {
                          notifications.sendToast('✅ Ripristinato', 'Dati recuperati dal backup', 'success');
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          notifications.sendToast('❌ Errore', 'Nessun backup disponibile', 'error');
                        }
                      }}
                    >
                      Ripristina
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
                <h3 className="font-semibold">Pulizia Selettiva</h3>
                <p className="text-sm text-muted-foreground">Elimina solo ciò che vuoi</p>
              </div>
            </div>

            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina solo transazioni
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare tutte le transazioni?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Verranno eliminate {dataStats.transactionCount} transazioni. Gli obiettivi di risparmio verranno mantenuti.
                      Un backup automatico verrà creato prima dell'eliminazione.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        financeStore.clearTransactions();
                        notifications.sendToast('🗑️ Transazioni eliminate', 'Backup creato automaticamente', 'success');
                      }}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      Elimina transazioni
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina solo obiettivi
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare tutti gli obiettivi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Verranno eliminati {dataStats.goalsCount} obiettivi di risparmio. Le transazioni verranno mantenute.
                      Un backup automatico verrà creato prima dell'eliminazione.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        financeStore.clearGoals();
                        notifications.sendToast('🗑️ Obiettivi eliminati', 'Backup creato automaticamente', 'success');
                      }}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      Elimina obiettivi
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
                <h3 className="font-semibold text-destructive">Zona Pericolosa</h3>
                <p className="text-sm text-muted-foreground">Azioni irreversibili</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina tutti i dati
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione eliminerà permanentemente tutti i tuoi dati finanziari,
                    transazioni e obiettivi di risparmio. Non potrai recuperarli.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={settings.resetData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Elimina tutto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GlassCard>

          {/* Privacy & Security Info */}
          <GlassCard className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">I tuoi dati sono protetti</h3>
                <p className="text-sm text-muted-foreground">Crittografia AES-256 + TLS/SSL</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary shrink-0" />
                <span>Dati crittografati a riposo e in transito</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-primary shrink-0" />
                <span>Isolamento completo con Row Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-primary shrink-0" />
                <span>Nessuna condivisione con terze parti</span>
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
              Leggi la Privacy Policy completa
            </Button>
          </GlassCard>

          {/* Account Deletion */}
          <GlassCard className="p-4 border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Elimina Account</h3>
                <p className="text-sm text-muted-foreground">Cancella account e tutti i dati</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={deletingAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deletingAccount ? 'Eliminazione in corso...' : 'Elimina il mio account'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Eliminare definitivamente il tuo account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione è <strong>irreversibile</strong>. Verranno eliminati permanentemente:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Tutte le transazioni</li>
                      <li>Tutti gli obiettivi di risparmio</li>
                      <li>Il tuo profilo e impostazioni</li>
                      <li>Il tuo account di accesso</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
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

                        notifications.sendToast('👋 Account eliminato', 'Tutti i tuoi dati sono stati cancellati', 'success');
                        localStorage.clear();
                        setTimeout(() => {
                          signOut();
                        }, 1500);
                      } catch (err) {
                        console.error('Error deleting account:', err);
                        notifications.sendToast('❌ Errore', 'Impossibile eliminare l\'account', 'error');
                        setDeletingAccount(false);
                      }
                    }}
                  >
                    Sì, elimina tutto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GlassCard>

          {/* Version Info */}
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>FinanceFlow v1.0.0</p>
            <p className="text-xs mt-1">Made with ❤️</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
