import {
  LayoutDashboard,
  ArrowUpDown,
  CalendarDays,
  PiggyBank,
  Wallet,
  Target,
  Settings,
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
import cashowLogo from '@/assets/cashow-logo.png.asset.json';


type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar';

interface AppSidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onOpenSettings: () => void;
}

export function AppSidebar({ currentView, onViewChange, onOpenSettings }: AppSidebarProps) {
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
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          aria-label="Cashow — Dashboard"
          className={cn(
            'flex w-full items-center gap-3 px-2 py-3 cursor-pointer text-left rounded-xl hover:bg-sidebar-accent/50 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <img
            src={cashowLogo.url}
            alt="Cashow"
            className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-white/10"
          />

          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-[22px] leading-none tracking-tight text-shine font-bold">
                Cashow
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                Liquid Finance
              </div>
            </div>
          )}
        </button>


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
                    onClick={() => handleSelect(item.id)}
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
                    onClick={() => handleSelect(item.id)}
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
            <SidebarMenuButton onClick={() => { onOpenSettings(); if (isMobile) setOpenMobile(false); }} tooltip={t('settings.title') || 'Settings'} className="rounded-lg">
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
