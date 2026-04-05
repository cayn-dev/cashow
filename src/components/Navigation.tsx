import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowUpDown,
  Wallet,
  Target,
  Settings,
  Lock,
  LogOut,
  ChevronDown,
} from 'lucide-react';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard' as View, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'transactions' as View, label: t('nav.transactions'), icon: ArrowUpDown },
    { id: 'salary' as View, label: t('nav.salary'), icon: Wallet },
    { id: 'savings' as View, label: t('nav.savings'), icon: Target },
  ];

  const currentItem = navItems.find(item => item.id === currentView) || navItems[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="relative z-50 mb-5" style={{ overflow: 'visible' }}>
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-2xl border border-card-border"
        style={{
          background: 'hsl(0 0% 100% / 0.05)',
          backdropFilter: 'blur(80px) saturate(200%)',
          WebkitBackdropFilter: 'blur(80px) saturate(200%)',
          boxShadow: '0 0 0 0.5px hsl(0 0% 100% / 0.08) inset, 0 1px 0 0 hsl(0 0% 100% / 0.1) inset, 0 4px 24px hsl(0 0% 0% / 0.2)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/20">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground tracking-tight hidden sm:block">FinanceFlow</span>
        </div>

        {/* Dropdown */}
        <div className="relative" ref={menuRef}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
            style={{
              background: 'hsl(var(--primary) / 0.12)',
              border: '0.5px solid hsl(var(--primary) / 0.2)',
            }}
          >
            <currentItem.icon className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-primary">{currentItem.label}</span>
            <motion.div
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-primary/70" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[220px] rounded-2xl border border-card-border shadow-2xl overflow-hidden"
                style={{
                  zIndex: 9999,
                  background: 'hsl(0 0% 8%)',
                  backdropFilter: 'blur(80px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(80px) saturate(200%)',
                  boxShadow: '0 0 0 0.5px hsl(0 0% 100% / 0.08) inset, 0 24px 48px hsl(0 0% 0% / 0.5)',
                }}
              >
                <div className="p-1.5">
                  {navItems.map((item, idx) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      onClick={() => {
                        onViewChange(item.id);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left',
                        currentView === item.id
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {currentView === item.id && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {pinEnabled && onLock && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onLock}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title={t('nav.lockApp')}
            >
              <Lock className="w-[18px] h-[18px]" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-[18px] h-[18px]" />
          </motion.button>
          {onLogout && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onLogout}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut className="w-[18px] h-[18px]" />
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
}
