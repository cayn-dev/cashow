import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowUpDown,
  PiggyBank,
  Wallet,
  Target,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeedback } from '@/hooks/useFeedback';

export type TabView = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar' | 'accounts';

interface LiquidTabBarProps {
  currentView: TabView;
  onViewChange: (view: TabView) => void;
  onOpenSettings?: () => void;
  className?: string;
}

/**
 * iOS 26 style floating Liquid Glass tab bar.
 * Detached from screen edges, full capsule, heavy backdrop blur,
 * active item is a solid dark pill that slides between positions.
 */
export function LiquidTabBar({ currentView, onViewChange, onOpenSettings, className }: LiquidTabBarProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();

  const items: { id: TabView; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav.transactions'), icon: ArrowUpDown },
    { id: 'accounts', label: t('nav.accounts'), icon: Landmark },
    { id: 'budget', label: t('nav.budget'), icon: PiggyBank },
    { id: 'salary', label: t('nav.salary'), icon: Wallet },
    { id: 'savings', label: t('nav.savings'), icon: Target },
  ];

  return (
    <nav
      aria-label={t('nav.dashboard')}
      className={cn(
        'fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50',
        className
      )}
    >
      <div className="liquid-bar w-full gap-0.5 p-1.5 overflow-x-auto no-scrollbar">
        {items.map((item) => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                feedback.tap();
                onViewChange(item.id);
              }}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 min-w-[52px] rounded-full px-1 py-1.5 tap-shrink"
            >
              {active && (
                <motion.span
                  layoutId="liquid-tab-pill"
                  className="absolute inset-0 rounded-full liquid-pill-active"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={cn(
                  'relative flex flex-col items-center gap-0.5',
                  active ? 'liquid-tab-active text-foreground' : 'text-foreground/75'
                )}
              >
                <item.icon className="w-[19px] h-[19px]" strokeWidth={1.6} />
                <span className="text-[10px] font-medium leading-none truncate max-w-full">
                  {item.label}
                </span>
              </span>
            </button>
          );
        })}

      </div>
    </nav>
  );
}
