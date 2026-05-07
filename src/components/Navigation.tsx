import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedback } from '@/hooks/useFeedback';
import {
  LayoutDashboard,
  ArrowUpDown,
  Wallet,
  Target,
  Settings,
  Lock,
  LogOut,
  ChevronDown,
  PiggyBank,
  CalendarDays,
  Building2,
  Users,
} from 'lucide-react';
import { InstallPWAButton } from '@/components/InstallPWAButton';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar' | 'accounts' | 'groups';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onOpenSettings: () => void;
  onLock?: () => void;
  pinEnabled?: boolean;
  onLogout?: () => void;
}

export function Navigation({ currentView, onViewChange, onOpenSettings, onLock, pinEnabled, onLogout }: NavigationProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const navItems = [
    { id: 'dashboard' as View, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'transactions' as View, label: t('nav.transactions'), icon: ArrowUpDown },
    { id: 'accounts' as View, label: t('nav.accounts'), icon: Building2 },
    { id: 'groups' as View, label: t('nav.groups'), icon: Users },
    { id: 'calendar' as View, label: t('nav.calendar'), icon: CalendarDays },
    { id: 'budget' as View, label: t('nav.budget'), icon: PiggyBank },
    { id: 'salary' as View, label: t('nav.salary'), icon: Wallet },
    { id: 'savings' as View, label: t('nav.savings'), icon: Target },
  ];

  const currentItem = navItems.find(item => item.id === currentView) || navItems[0];

  // Position dropdown via portal under the trigger
  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const desiredWidth = Math.max(r.width, 240);
      // Center under trigger but clamp to viewport with 12px padding
      let left = r.left + r.width / 2 - desiredWidth / 2;
      const maxLeft = window.innerWidth - desiredWidth - 12;
      if (left > maxLeft) left = maxLeft;
      if (left < 12) left = 12;
      setMenuPos({ top: r.bottom + 8, left, width: desiredWidth });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [menuOpen]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleSelect = (id: View) => {
    feedback.tap();
    onViewChange(id);
    setMenuOpen(false);
  };

  return (
    <nav className="relative z-40 mb-5">
      <div
        className="relative flex items-center gap-2 px-2 py-2 rounded-[28px] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.10) 0%, hsl(0 0% 100% / 0.04) 100%)',
          backdropFilter: 'blur(40px) saturate(220%)',
          WebkitBackdropFilter: 'blur(40px) saturate(220%)',
          border: '0.5px solid hsl(0 0% 100% / 0.14)',
          boxShadow:
            '0 0 0 0.5px hsl(0 0% 100% / 0.06) inset, 0 1px 0 0 hsl(0 0% 100% / 0.18) inset, 0 -1px 0 0 hsl(0 0% 0% / 0.2) inset, 0 8px 32px hsl(0 0% 0% / 0.28), 0 16px 48px hsl(0 0% 0% / 0.18)',
        }}
      >
        {/* Top sheen highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[28px]"
          style={{
            background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.10) 0%, transparent 100%)',
          }}
        />

        {/* Brand pill */}
        <div className="relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(211 100% 42%) 100%)',
              boxShadow:
                '0 0 0 0.5px hsl(0 0% 100% / 0.25) inset, 0 1px 0 0 hsl(0 0% 100% / 0.3) inset, 0 -1px 0 0 hsl(0 0% 0% / 0.2) inset, 0 4px 12px hsl(var(--primary) / 0.4), 0 8px 20px hsl(var(--primary) / 0.2)',
            }}
          >
            <Wallet className="w-[18px] h-[18px] text-white drop-shadow-sm" />
          </div>
          <span
            className="font-semibold text-[15px] tracking-tight hidden sm:inline-block"
            style={{
              background: 'linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 80%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cashow
          </span>
        </div>

        {/* Center spacer that grows */}
        <div className="flex-1 flex justify-center min-w-0">
          {/* Dropdown trigger */}
          <motion.button
            ref={triggerRef}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              feedback.tap();
              setMenuOpen(o => !o);
            }}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 min-w-0"
            style={{
              background: menuOpen
                ? 'linear-gradient(180deg, hsl(var(--primary) / 0.22) 0%, hsl(var(--primary) / 0.12) 100%)'
                : 'linear-gradient(180deg, hsl(0 0% 100% / 0.10) 0%, hsl(0 0% 100% / 0.04) 100%)',
              border: '0.5px solid hsl(0 0% 100% / 0.14)',
              boxShadow:
                '0 0 0 0.5px hsl(0 0% 100% / 0.05) inset, 0 1px 0 0 hsl(0 0% 100% / 0.15) inset, 0 2px 6px hsl(0 0% 0% / 0.2)',
            }}
          >
            <currentItem.icon className="w-[16px] h-[16px] text-foreground/90 shrink-0" />
            <span className="font-semibold text-[14px] text-foreground tracking-tight truncate">
              {currentItem.label}
            </span>
            <motion.div
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0"
            >
              <ChevronDown className="w-3.5 h-3.5 text-foreground/60" />
            </motion.div>
          </motion.button>
        </div>

        {/* Actions */}
        <div className="relative flex items-center gap-1">
          <InstallPWAButton />
          {pinEnabled && onLock && (
            <ActionButton
              onClick={() => { feedback.tap(); onLock(); }}
              title={t('nav.lockApp')}
            >
              <Lock className="w-[17px] h-[17px]" />
            </ActionButton>
          )}
          <ActionButton
            onClick={() => { feedback.tap(); onOpenSettings(); }}
            title={t('settings.title').replace(/[⚙️\s]/g, '')}
          >
            <Settings className="w-[17px] h-[17px]" />
          </ActionButton>
          {onLogout && (
            <ActionButton
              onClick={() => { feedback.tap(); onLogout(); }}
              title={t('nav.logout')}
              danger
            >
              <LogOut className="w-[17px] h-[17px]" />
            </ActionButton>
          )}
        </div>
      </div>

      {/* Dropdown via portal — never clipped */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {menuOpen && menuPos && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
              className="fixed rounded-2xl overflow-hidden"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                zIndex: 99999,
                transformOrigin: 'top center',
                background: 'linear-gradient(180deg, hsl(0 0% 12% / 0.9) 0%, hsl(0 0% 8% / 0.92) 100%)',
                backdropFilter: 'blur(40px) saturate(220%)',
                WebkitBackdropFilter: 'blur(40px) saturate(220%)',
                border: '0.5px solid hsl(0 0% 100% / 0.14)',
                boxShadow:
                  '0 0 0 0.5px hsl(0 0% 100% / 0.06) inset, 0 1px 0 0 hsl(0 0% 100% / 0.14) inset, 0 24px 64px hsl(0 0% 0% / 0.6), 0 8px 24px hsl(0 0% 0% / 0.4)',
              }}
              role="menu"
            >
              <div className="p-1.5">
                {navItems.map((item, idx) => {
                  const active = currentView === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.035, duration: 0.18 }}
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-200 text-left',
                        active
                          ? 'text-primary'
                          : 'text-foreground/80 hover:text-foreground hover:bg-white/5'
                      )}
                      style={
                        active
                          ? {
                              background:
                                'linear-gradient(180deg, hsl(var(--primary) / 0.20) 0%, hsl(var(--primary) / 0.10) 100%)',
                              boxShadow:
                                '0 0 0 0.5px hsl(var(--primary) / 0.25) inset, 0 1px 0 0 hsl(0 0% 100% / 0.1) inset',
                            }
                          : undefined
                      }
                      role="menuitem"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium text-[14px]">{item.label}</span>
                      {active && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </nav>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200',
        danger
          ? 'text-foreground/70 hover:text-destructive hover:bg-destructive/10'
          : 'text-foreground/80 hover:text-foreground hover:bg-white/8'
      )}
      style={{
        background: 'transparent',
      }}
    >
      {children}
    </motion.button>
  );
}
