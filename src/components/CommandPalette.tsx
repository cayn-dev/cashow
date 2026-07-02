import { useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  ArrowUpDown,
  CalendarDays,
  PiggyBank,
  Wallet,
  Target,
  Settings,
  Lock,
  RefreshCw,
  Plus,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onNavigate: (v: View) => void;
  onOpenSettings: () => void;
  onLock?: () => void;
  onAddTransaction: () => void;
  onLogout?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onOpenSettings,
  onLock,
  onAddTransaction,
  onLogout,
}: CommandPaletteProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 30);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t('command.placeholder') || 'Cerca comandi, viste, azioni…'} />
      <CommandList>
        <CommandEmpty>{t('command.empty') || 'Nessun risultato.'}</CommandEmpty>

        <CommandGroup heading={t('command.actions') || 'Azioni rapide'}>
          <CommandItem onSelect={() => run(onAddTransaction)}>
            <Plus className="w-4 h-4" />
            <span>{t('transactions.add') || 'Nuova transazione'}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => window.location.reload())}>
            <RefreshCw className="w-4 h-4" />
            <span>{t('nav.refresh') || 'Aggiorna app'}</span>
          </CommandItem>
          {onLock && (
            <CommandItem onSelect={() => run(onLock)}>
              <Lock className="w-4 h-4" />
              <span>{t('nav.lockApp') || 'Blocca app'}</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => run(onOpenSettings)}>
            <Settings className="w-4 h-4" />
            <span>{t('settings.title')?.replace(/[⚙️\s]/g, '') || 'Impostazioni'}</span>
          </CommandItem>
          {onLogout && (
            <CommandItem onSelect={() => run(onLogout)}>
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout') || 'Logout'}</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('command.navigate') || 'Vai a'}>
          <CommandItem onSelect={() => run(() => onNavigate('dashboard'))}>
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('nav.dashboard')}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('transactions'))}>
            <ArrowUpDown className="w-4 h-4" />
            <span>{t('nav.transactions')}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('calendar'))}>
            <CalendarDays className="w-4 h-4" />
            <span>{t('nav.calendar')}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('budget'))}>
            <PiggyBank className="w-4 h-4" />
            <span>{t('nav.budget')}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('salary'))}>
            <Wallet className="w-4 h-4" />
            <span>{t('nav.salary')}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('savings'))}>
            <Target className="w-4 h-4" />
            <span>{t('nav.savings')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
