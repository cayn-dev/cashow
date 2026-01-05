import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  Wallet, 
  Target,
  Settings 
} from 'lucide-react';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const navItems = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions' as View, label: 'Movimenti', icon: ArrowUpDown },
  { id: 'salary' as View, label: 'Stipendio', icon: Wallet },
  { id: 'savings' as View, label: 'Risparmi', icon: Target },
];

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="glass-panel p-2 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg hidden sm:block">FinanceFlow</span>
        </div>
        
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                currentView === item.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium text-sm hidden md:block">{item.label}</span>
            </button>
          ))}
        </div>

        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
