import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowUpDown,
  PiggyBank,
  CalendarDays,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeedback } from '@/hooks/useFeedback';
import { useEffect, useState } from 'react';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

/**
 * iOS 26 Liquid Glass floating tab bar.
 * Detached capsule with strong backdrop blur; the active item is a solid dark
 * pill that slides between positions. Compacts to icons-only while scrolling down.
 */
export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 8) {
        setCompact(y > last && y > 80);
        last = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items: { id: View; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav.transactions'), icon: ArrowUpDown },
    { id: 'budget', label: t('nav.budget'), icon: PiggyBank },
    { id: 'calendar', label: t('nav.calendar'), icon: CalendarDays },
    { id: 'savings', label: t('nav.savings'), icon: Target },
  ];

  return (
    <nav
      aria-label={t('nav.dashboard')}
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
        <div className="mx-3 pointer-events-auto">
          <div className="glass-capsule flex items-stretch justify-between gap-0.5 p-1.5">
            {items.map((item) => {
              const active = item.id === currentView;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    feedback.tap();
                    onViewChange(item.id);
                  }}
                  className={cn(
                    'press relative flex-1 min-w-0 rounded-full flex flex-col items-center justify-center gap-0.5 px-1',
                    compact ? 'py-2.5' : 'py-2',
                    active ? 'text-primary-foreground' : 'text-foreground/65'
                  )}
                >
                  <motion.span
                    aria-hidden
                    initial={false}
                    animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.82 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: 'hsl(var(--primary))',
                      boxShadow:
                        '0 1px 0 0 hsl(0 0% 100% / 0.22) inset, 0 6px 20px hsl(var(--primary) / 0.45)',
                    }}
                  />
                  <Icon className="relative w-[21px] h-[21px]" strokeWidth={1.6} />
                  {!compact && (
                    <span className="relative text-[10px] font-medium leading-none truncate max-w-full">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
    </nav>
  );
}
