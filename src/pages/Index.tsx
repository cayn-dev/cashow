import { useState, useEffect } from 'react';
import { useSupabaseFinanceStore } from '@/hooks/useSupabaseFinanceStore';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { Navigation } from '@/components/Navigation';
import { DashboardView } from '@/components/views/DashboardView';
import { TransactionsView } from '@/components/views/TransactionsView';
import { SalaryView } from '@/components/views/SalaryView';
import { SavingsView } from '@/components/views/SavingsView';
import { BudgetView } from '@/components/views/BudgetView';
import { CalendarView } from '@/components/views/CalendarView';
import { AccountsView } from '@/components/views/AccountsView';
import { GroupsView } from '@/components/views/GroupsView';
import { SettingsDialog } from '@/components/SettingsDialog';
import { PinLockScreen } from '@/components/PinLockScreen';
import { AuroraBackground } from '@/components/AuroraBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings' | 'budget' | 'calendar' | 'accounts' | 'groups';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isAuthenticated, isGuest, signOut } = useAuth();
  const settings = useSettings();
  const { t } = useLanguage();

  // Use cloud store for authenticated users, local store for guests
  const cloudStore = useSupabaseFinanceStore();
  const localStore = useFinanceStore();
  const store = isAuthenticated && !isGuest ? cloudStore : localStore;

  const salaryTransactions = store.transactions.filter(t => t.isSalary);

  // Show loading state (only for cloud store)
  if (isAuthenticated && !isGuest && cloudStore.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  // Show PIN lock screen if app is locked
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

  const handleLogout = isGuest ? undefined : signOut;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated aurora background — drifts behind the glass for live refraction */}
      <AuroraBackground intensity="medium" />

      <div className="relative z-10 container max-w-7xl mx-auto py-6 px-4">
        <Navigation 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onOpenSettings={() => setSettingsOpen(true)}
          onLock={settings.lockApp}
          pinEnabled={settings.pinEnabled}
          onLogout={handleLogout}
        />

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
            onViewTransactions={() => setCurrentView('transactions')}
            currencySymbol={settings.currencySymbol}
          />
        )}

        {currentView === 'transactions' && (
          <TransactionsView
            transactions={store.transactions}
            onAddTransaction={store.addTransaction}
            onDeleteTransaction={store.deleteTransaction}
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
          <BudgetView
            transactions={store.transactions}
            currencySymbol={settings.currencySymbol}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            transactions={store.transactions}
            currencySymbol={settings.currencySymbol}
          />
        )}
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
