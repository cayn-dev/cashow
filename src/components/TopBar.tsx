import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, RefreshCw, Command as CommandIcon, Search } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeedback } from '@/hooks/useFeedback';
import { InstallPWAButton } from '@/components/InstallPWAButton';
import { motion } from 'framer-motion';

interface TopBarProps {
  onLock?: () => void;
  pinEnabled?: boolean;
  onLogout?: () => void;
  onOpenCommand: () => void;
  viewLabel: string;
}

export function TopBar({ onLock, pinEnabled, onLogout, onOpenCommand, viewLabel }: TopBarProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 h-14 px-3 sm:px-5 border-b border-border/60"
      style={{
        background: 'linear-gradient(180deg, hsl(0 0% 5% / 0.92) 0%, hsl(0 0% 4% / 0.85) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      <SidebarTrigger className="text-foreground/70 hover:text-foreground" />

      <div className="hidden md:flex items-baseline gap-3 min-w-0 flex-1">
        <span className="font-display italic text-lg text-foreground/90 truncate">
          {viewLabel}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground truncate">
          {dateLabel}
        </span>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Command trigger */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { feedback.tap(); onOpenCommand(); }}
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border/60 bg-background/40 hover:bg-primary/8 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground group"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-[12px] tracking-tight">{t('nav.commandPalette') || 'Quick actions'}</span>
        <kbd className="ml-2 hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/60 bg-background/60">
          ⌘K
        </kbd>
      </motion.button>

      <div className="flex items-center gap-0.5">
        <InstallPWAButton />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('nav.commandPalette') || 'Commands'}
          className="sm:hidden h-9 w-9 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/10"
          onClick={() => { feedback.tap(); onOpenCommand(); }}
        >
          <CommandIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('nav.refresh') || 'Refresh'}
          className="h-9 w-9 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/10"
          onClick={() => { feedback.tap(); window.location.reload(); }}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
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
