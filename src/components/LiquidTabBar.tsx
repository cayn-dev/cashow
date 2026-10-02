import { motion } from 'framer-motion';
import { Home, ArrowUpDown, PiggyBank, Wallet, Target, Landmark, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeedback } from '@/hooks/useFeedback';

export type TabView = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar' | 'accounts';

interface LiquidTabBarProps {
  currentView: TabView;
  onViewChange: (view: TabView) => void;
  onOpenSettings?: () => void;
  onAdd?: () => void;
  className?: string;
}

/** Minimal floating pill: active tab shows icon + label, others icon only; separate round add button. */
export function LiquidTabBar({ currentView, onViewChange, onAdd, className }: LiquidTabBarProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();

  const items: { id: TabView; label: string; icon: typeof Home }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'transactions', label: t('nav.transactions'), icon: ArrowUpDown },
    { id: 'accounts', label: t('nav.accounts'), icon: Landmark },
    { id: 'budget', label: t('nav.budget'), icon: PiggyBank },
    { id: 'salary', label: t('nav.salary'), icon: Wallet },
    { id: 'savings', label: t('nav.savings'), icon: Target },
  ];

  return (
    <nav
      aria-label="Navigation"
      className={cn(
        'fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex justify-center gap-2 px-3',
        className
      )}
    >
      <div className="liquid-bar gap-0.5 p-1.5 min-w-0 overflow-x-auto no-scrollbar">
        {items.map((item) => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => { feedback.tap(); onViewChange(item.id); }}
              className="relative h-11 shrink-0 rounded-full px-3.5 tap-shrink"
            >
              {active && (
                <motion.span
                  layoutId="liquid-tab-pill"
                  className="absolute inset-0 rounded-full liquid-pill-active"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <span className={cn('relative flex items-center gap-1.5', active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                {active && <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {onAdd && (
        <button
          type="button"
          aria-label={t('transactions.add') || 'Add'}
          onClick={() => { feedback.tap(); onAdd(); }}
          className="liquid-bar h-14 w-14 shrink-0 justify-center text-foreground tap-shrink"
        >
          <Plus className="w-6 h-6" strokeWidth={1.8} />
        </button>
      )}
    </nav>
  );
}
