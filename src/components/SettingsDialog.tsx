import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useSettings, Theme, Currency } from '@/hooks/useSettings';
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
              onValueChange={(value: Currency) => settings.setCurrency(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                <SelectItem value="USD">$ Dollaro (USD)</SelectItem>
                <SelectItem value="GBP">£ Sterlina (GBP)</SelectItem>
              </SelectContent>
            </Select>
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
                  onCheckedChange={settings.toggleNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Promemoria giornaliero</Label>
                  <p className="text-xs text-muted-foreground">Ricordati di registrare le spese</p>
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
                  <p className="text-xs text-muted-foreground">Quando spendi troppo</p>
                </div>
                <Switch
                  checked={settings.spendingAlerts}
                  onCheckedChange={settings.toggleSpendingAlerts}
                  disabled={!settings.notificationsEnabled}
                />
              </div>
              
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
