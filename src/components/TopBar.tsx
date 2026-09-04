import { Button } from '@/components/ui/button';
import { Lock, LogOut, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeedback } from '@/hooks/useFeedback';
import { InstallPWAButton } from '@/components/InstallPWAButton';
import { motion } from 'framer-motion';

interface TopBarProps {
  onLock?: () => void;
  pinEnabled?: boolean;
  onLogout?: () => void;
  viewLabel: string;
}

export function TopBar({ onLock, pinEnabled, onLogout, viewLabel }: TopBarProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="glass-topbar sticky top-0 z-30 flex items-center gap-3 h-14 px-3 sm:px-5">

      <div className="hidden md:flex items-baseline gap-3 min-w-0 flex-1">
        <span className="font-display italic text-lg text-foreground/90 truncate">
          {viewLabel}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground truncate">
          {dateLabel}
        </span>
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-0.5">
        <InstallPWAButton />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('nav.refresh') || 'Refresh'}
          className="h-9 w-9 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/10"
          onClick={() => { feedback.tap(); window.location.reload(); }}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('settings.title')?.replace(/[⚙️\s]/g, '') || 'Settings'}
            className="h-9 w-9 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/10"
            onClick={() => { feedback.tap(); onOpenSettings(); }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
        {pinEnabled && onLock && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('nav.lockApp') || 'Lock'}
            className="h-9 w-9 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/10"
            onClick={() => { feedback.tap(); onLock(); }}
          >
            <Lock className="w-4 h-4" />
          </Button>
        )}
        {onLogout && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('nav.logout') || 'Logout'}
            className="h-9 w-9 rounded-lg text-foreground/70 hover:text-destructive hover:bg-destructive/10"
            onClick={() => { feedback.tap(); onLogout(); }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
