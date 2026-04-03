import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowUpDown,
  Wallet,
  Target,
  Settings,
  Lock,
  LogOut,
  ChevronDown,
  Menu,
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
    <nav className="glass-panel p-2 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg hidden sm:block">FinanceFlow</span>
        </div>

        {/* Dropdown menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          >
            <currentItem.icon className="w-4 h-4" />
            <span className="font-medium text-sm">{currentItem.label}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[200px] glass-panel rounded-xl border border-card-border shadow-xl z-50 overflow-hidden animate-fade-in">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 transition-all text-left',
                    currentView === item.id
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {pinEnabled && onLock && (
            <button
              onClick={onLock}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title={t('nav.lockApp')}
            >
              <Lock className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
