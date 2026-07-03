import {
  LayoutDashboard,
  ArrowUpDown,
  CalendarDays,
  PiggyBank,
  Wallet,
  Target,
  Settings,
  Command,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar';

interface AppSidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onOpenSettings: () => void;
  onOpenCommand: () => void;
}

export function AppSidebar({ currentView, onViewChange, onOpenSettings, onOpenCommand }: AppSidebarProps) {
  const { t } = useLanguage();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const handleSelect = (id: View) => {
    onViewChange(id);
    if (isMobile) setOpenMobile(false);
  };
  const collapsed = state === 'collapsed';

  const primary: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav.transactions'), icon: ArrowUpDown },
    { id: 'calendar', label: t('nav.calendar'), icon: CalendarDays },
  ];
  const secondary: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'budget', label: t('nav.budget'), icon: PiggyBank },
    { id: 'salary', label: t('nav.salary'), icon: Wallet },
    { id: 'savings', label: t('nav.savings'), icon: Target },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3 px-2 py-3', collapsed && 'justify-center px-0')}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'var(--gradient-gold)',
              boxShadow:
                '0 0 0 0.5px hsl(44 78% 82% / 0.4) inset, 0 4px 12px hsl(var(--primary) / 0.35)',
            }}
          >
            <span className="font-display text-lg font-normal text-[hsl(var(--primary-foreground))] italic">C</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-[22px] leading-none tracking-tight text-gold italic">
                Cashow
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                Editorial Finance
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-sans font-medium">
            {t('nav.overview') || 'Overview'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primary.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    tooltip={item.label}
                    className={cn(
                      'transition-all duration-300 rounded-lg',
                      currentView === item.id &&
                        'bg-primary/12 text-primary-glow before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[2px] before:rounded-r before:bg-primary',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-sans text-[13px] font-medium tracking-tight">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-sans font-medium">
            {t('nav.planning') || 'Planning'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondary.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    tooltip={item.label}
                    className={cn(
                      'transition-all duration-300 rounded-lg',
                      currentView === item.id &&
                        'bg-primary/12 text-primary-glow before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[2px] before:rounded-r before:bg-primary',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-sans text-[13px] font-medium tracking-tight">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenCommand} tooltip={t('nav.commandPalette') || 'Command'} className="rounded-lg">
              <Command className="w-4 h-4" />
              <span className="font-sans text-[13px] tracking-tight flex-1">
                {t('nav.commandPalette') || 'Command'}
              </span>
              {!collapsed && (
                <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                  ⌘K
                </kbd>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenSettings} tooltip={t('settings.title') || 'Settings'} className="rounded-lg">
              <Settings className="w-4 h-4" />
              <span className="font-sans text-[13px] tracking-tight">
                {t('settings.title')?.replace(/[⚙️\s]/g, '') || 'Settings'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
