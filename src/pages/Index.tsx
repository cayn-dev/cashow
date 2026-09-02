import { useState, useMemo, useEffect } from 'react';
import { useSupabaseFinanceStore } from '@/hooks/useSupabaseFinanceStore';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { TopBar } from '@/components/TopBar';
import { DashboardView } from '@/components/views/DashboardView';
import { TransactionsView } from '@/components/views/TransactionsView';
import { SalaryView } from '@/components/views/SalaryView';
import { SavingsView } from '@/components/views/SavingsView';
import { BudgetView } from '@/components/views/BudgetView';
import { CalendarView } from '@/components/views/CalendarView';
import { AccountsView } from '@/components/views/AccountsView';
import { SettingsDialog } from '@/components/SettingsDialog';
import { PinLockScreen } from '@/components/PinLockScreen';
import { AuroraBackground } from '@/components/AuroraBackground';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { Seo } from '@/components/Seo';
import { LiquidTabBar } from '@/components/LiquidTabBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar' | 'accounts';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTxTick, setAddTxTick] = useState(0);
  const { isAuthenticated, isGuest, signOut } = useAuth();
  const settings = useSettings();
  const { t } = useLanguage();

  const cloudStore = useSupabaseFinanceStore();
  const localStore = useFinanceStore();
  const store = isAuthenticated && !isGuest ? cloudStore : localStore;

  // Ritorno dal flusso di collegamento bancario: sincronizza e pulisci l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bank') !== 'connected') return;
    window.history.replaceState({}, '', window.location.pathname);
    toast.info(t('bank.connectedToast'));
    supabase.functions.invoke('bank-link', { body: { action: 'sync' } }).then(({ data, error }) => {
      if (error) {
        toast.error(t('bank.errorSync'));
        return;
      }
      toast.success(t('bank.synced', { count: String((data as any)?.imported ?? 0) }));
    });
  }, [t]);

  const salaryTransactions = store.transactions.filter((t) => t.isSalary);
  const handleLogout = isGuest ? undefined : signOut;

  const viewLabel = useMemo(() => {
    const map: Record<View, string> = {
      dashboard: t('nav.dashboard'),
      transactions: t('nav.transactions'),
      calendar: t('nav.calendar'),
      budget: t('nav.budget'),
      salary: t('nav.salary'),
      savings: t('nav.savings'),
      accounts: t('nav.accounts'),
    };
    return map[currentView];
  }, [currentView, t]);

  // Loading state — liquid-glass skeleton coherent with dashboard layout
  if (isAuthenticated && !isGuest && cloudStore.loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <AuroraBackground />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <DashboardSkeleton />
          <span className="sr-only" role="status" aria-live="polite">
            {t('loading.data')}
          </span>
        </div>
      </div>
    );
  }

  if (settings.isLocked) {
    return (
      <PinLockScreen
        onUnlock={settings.verifyPin}
        onBiometricUnlock={settings.verifyBiometric}
        biometricEnabled={settings.biometricEnabled}
        pinEnabled={settings.pinEnabled}
      />
    );
  }

  return (
    <>
      <Seo
        title="Cashow — Editorial Personal Finance"
        description="Cashow: la finanza personale in versione editoriale. Nero, oro e serif per un controllo elegante delle tue entrate e uscite."
        path="/"
      />
      <div className="min-h-dvh flex w-full text-foreground relative">
        <div aria-hidden className="wash-navy fixed inset-0 z-0 pointer-events-none" />
        <AuroraBackground intensity="subtle" />


        <div className="relative z-10 min-w-0 flex-1 flex flex-col">
          <TopBar
            onLock={settings.lockApp}
            pinEnabled={settings.pinEnabled}
            onLogout={handleLogout}
            viewLabel={viewLabel}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <main className="flex-1 px-3 sm:px-6 lg:px-8 py-6 pb-32 max-w-[1480px] w-full mx-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                monthlyIncome={store.monthlyIncome}
                monthlyExpenses={store.monthlyExpenses}
                monthlyBalance={store.monthlyBalance}
                totalSavings={store.totalSavings}
                monthlySalary={store.monthlySalary}
                expensesByCategory={store.expensesByCategory}
                recentTransactions={store.currentMonthTransactions}
                allTransactions={store.transactions}
                savingsGoals={store.savingsGoals}
                onAddTransaction={store.addTransaction}
                onDeleteTransaction={store.deleteTransaction}
                onUpdateTransaction={store.updateTransaction}
                onViewTransactions={() => setCurrentView('transactions')}
                currencySymbol={settings.currencySymbol}
                openAddTxTick={addTxTick}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}

            {currentView === 'transactions' && (
              <TransactionsView
                transactions={store.transactions}
                onAddTransaction={store.addTransaction}
                onDeleteTransaction={store.deleteTransaction}
                onUpdateTransaction={store.updateTransaction}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentView === 'salary' && (
              <SalaryView
                monthlySalary={store.monthlySalary}
                cumulativeSalary={store.cumulativeSalary}
                salaryTransactions={salaryTransactions}
                onSetMonthlySalary={store.setMonthlySalary}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentView === 'savings' && (
              <SavingsView
                savingsGoals={store.savingsGoals}
                totalSavings={store.totalSavings}
                onAddGoal={store.addSavingsGoal}
                onUpdateGoal={store.updateSavingsGoal}
                onDeleteGoal={store.deleteSavingsGoal}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentView === 'budget' && (
              <BudgetView transactions={store.transactions} currencySymbol={settings.currencySymbol} />
            )}

            {currentView === 'accounts' && (
              <AccountsView currencySymbol={settings.currencySymbol} />
            )}

            {currentView === 'calendar' && (
              <CalendarView transactions={store.transactions} currencySymbol={settings.currencySymbol} />
            )}
          </main>
        </div>

        <LiquidTabBar
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </>
  );
};

export default Index;
