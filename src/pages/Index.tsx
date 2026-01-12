import { useState } from 'react';
import { useFinanceStore } from '@/hooks/useFinanceStore';
import { useSettings } from '@/hooks/useSettings';
import { Navigation } from '@/components/Navigation';
import { DashboardView } from '@/components/views/DashboardView';
import { TransactionsView } from '@/components/views/TransactionsView';
import { SalaryView } from '@/components/views/SalaryView';
import { SavingsView } from '@/components/views/SavingsView';
import { SettingsDialog } from '@/components/SettingsDialog';
import { PinLockScreen } from '@/components/PinLockScreen';

type View = 'dashboard' | 'transactions' | 'salary' | 'savings';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const store = useFinanceStore();
  const settings = useSettings();

  const salaryTransactions = store.transactions.filter(t => t.isSalary);

  // Show PIN lock screen if app is locked
  if (settings.isLocked) {
    return <PinLockScreen onUnlock={settings.verifyPin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto py-6 px-4">
        <Navigation 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onOpenSettings={() => setSettingsOpen(true)}
          onLock={settings.lockApp}
          pinEnabled={settings.pinEnabled}
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
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
