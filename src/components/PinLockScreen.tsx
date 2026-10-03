import { useState, useEffect } from 'react';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from './GlassCard';
import { useLanguage } from '@/hooks/useLanguage';

interface PinLockScreenProps {
  onUnlock: (pin: string) => boolean | Promise<boolean>;
  onBiometricUnlock?: () => Promise<boolean>;
  biometricEnabled?: boolean;
  pinEnabled?: boolean;
}

export function PinLockScreen({ onUnlock, onBiometricUnlock, biometricEnabled = false, pinEnabled = true }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (biometricEnabled && onBiometricUnlock && !pinEnabled) {
      handleBiometricUnlock();
    }
  }, []);

  const handleNumberClick = async (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === 6) {
        const success = await onUnlock(newPin);
        if (!success) {
          setError(true);
          setShake(true);
          setTimeout(() => { setPin(''); setShake(false); }, 500);
        }
      }
    }
  };

  const handleDelete = () => { setPin(pin.slice(0, -1)); setError(false); };

  const handleSubmit = async () => {
    if (pin.length === 6) {
      const success = await onUnlock(pin);
      if (!success) {
        setError(true);
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); }, 500);
      }
    }
  };

  const handleBiometricUnlock = async () => {
    if (!onBiometricUnlock || biometricLoading) return;
    setBiometricLoading(true);
    try {
      const success = await onBiometricUnlock();
      if (!success) {
        setError(true); setShake(true);
        setTimeout(() => { setShake(false); setError(false); }, 500);
      }
    } catch { setError(true); }
    finally { setBiometricLoading(false); }
  };

  return (
    <div className="auth-screen min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      </div>

      <GlassCard className={`p-8 w-full max-w-sm relative z-10 ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Cashow</h1>
          <p className="text-muted-foreground">
            {pinEnabled ? t('pin.enterPin') : t('pin.useFaceId')}
          </p>
        </div>

        {pinEnabled && (
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? (error ? 'bg-destructive scale-110' : 'bg-primary scale-110') : 'bg-muted'}`} />
            ))}
          </div>
        )}

        {error && (
          <p className="text-destructive text-center text-sm mb-4 animate-fade-in">
            {pinEnabled ? t('pin.wrongPin') : t('pin.authFailed')}
          </p>
        )}

        {pinEnabled && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button key={num} onClick={() => handleNumberClick(num)} className="h-16 rounded-2xl bg-muted/50 hover:bg-muted text-2xl font-semibold transition-all active:scale-95 flex items-center justify-center">{num}</button>
            ))}
            <button onClick={biometricEnabled ? handleBiometricUnlock : undefined} className={`h-16 rounded-2xl flex items-center justify-center transition-all ${biometricEnabled ? 'bg-primary/20 hover:bg-primary/30 text-primary active:scale-95' : 'text-muted-foreground'}`} disabled={!biometricEnabled || biometricLoading}>
              <Fingerprint className={`w-6 h-6 ${biometricLoading ? 'animate-pulse' : ''}`} />
            </button>
            <button onClick={() => handleNumberClick('0')} className="h-16 rounded-2xl bg-muted/50 hover:bg-muted text-2xl font-semibold transition-all active:scale-95 flex items-center justify-center">0</button>
            <button onClick={handleDelete} className="h-16 rounded-2xl hover:bg-muted/50 flex items-center justify-center transition-all active:scale-95 text-muted-foreground"><Delete className="w-6 h-6" /></button>
          </div>
        )}

        {!pinEnabled && biometricEnabled && (
          <div className="flex flex-col items-center gap-6">
            <button onClick={handleBiometricUnlock} disabled={biometricLoading} className="w-24 h-24 rounded-3xl bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-all active:scale-95">
              <Fingerprint className={`w-12 h-12 text-primary ${biometricLoading ? 'animate-pulse' : ''}`} />
            </button>
            <p className="text-sm text-muted-foreground">{t('pin.touchFaceId')}</p>
          </div>
        )}

        {pinEnabled && pin.length === 6 && (
          <Button onClick={handleSubmit} className="w-full" size="lg">{t('pin.unlock')}</Button>
        )}
      </GlassCard>
    </div>
  );
}
