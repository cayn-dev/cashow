import { StatCard } from '@/components/StatCard';
import { ExpenseChart } from '@/components/ExpenseChart';
import { TransactionItem } from '@/components/TransactionItem';
import { GlassCard } from '@/components/GlassCard';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { InsightsPanel } from '@/components/InsightsPanel';
import { AIChatDialog } from '@/components/AIChatDialog';
import { useInsights } from '@/hooks/useInsights';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  ArrowRight
} from 'lucide-react';
import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';
import { Button } from '@/components/ui/button';

interface DashboardViewProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  totalSavings: number;
  monthlySalary: number;
  expensesByCategory: Record<CategoryType, number>;
  recentTransactions: Transaction[];
  allTransactions: Transaction[];
  savingsGoals: SavingsGoal[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onViewTransactions: () => void;
  currencySymbol?: string;
}

export function DashboardView({
  monthlyIncome,
  monthlyExpenses,
  monthlyBalance,
  totalSavings,
  monthlySalary,
  expensesByCategory,
  recentTransactions,
  allTransactions,
  savingsGoals,
  onAddTransaction,
  onDeleteTransaction,
  onViewTransactions,
  currencySymbol = '€',
}: DashboardViewProps) {
  const insights = useInsights(allTransactions);
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <AddTransactionDialog onAdd={onAddTransaction} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.monthlyIncome')} value={`${currencySymbol}${monthlyIncome.toLocaleString()}`} icon={TrendingUp} variant="income" delay={0} />
        <StatCard title={t('dashboard.monthlyExpenses')} value={`${currencySymbol}${monthlyExpenses.toLocaleString()}`} icon={TrendingDown} variant="expense" delay={100} />
        <StatCard title={t('dashboard.monthlyBalance')} value={`${currencySymbol}${monthlyBalance.toLocaleString()}`} subtitle={monthlyBalance >= 0 ? t('dashboard.saving') : t('dashboard.warning')} icon={Wallet} variant={monthlyBalance >= 0 ? 'income' : 'expense'} delay={200} />
        <StatCard title={t('dashboard.totalSavings')} value={`${currencySymbol}${totalSavings.toLocaleString()}`} icon={PiggyBank} variant="primary" delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={expensesByCategory} transactions={allTransactions} />
        <GlassCard className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">{t('dashboard.recentTransactions')}</h3>
            <Button variant="ghost" size="sm" onClick={onViewTransactions} className="text-primary hover:text-primary/80">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentTransactions.slice(0, 4).map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} onDelete={onDeleteTransaction} />
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">{t('dashboard.noTransactions')}</div>
            )}
          </div>
        </GlassCard>
      </div>

      {insights.length > 0 && (
        <GlassCard className="animate-slide-up">
          <InsightsPanel insights={insights} />
        </GlassCard>
      )}

      <AIChatDialog transactions={allTransactions} savingsGoals={savingsGoals} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} monthlyBalance={monthlyBalance} currencySymbol={currencySymbol} />

      {monthlySalary > 0 && (
        <GlassCard glow className="animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.monthlySalary')}</p>
                <p className="font-display text-2xl font-bold text-primary glow-text">
                  {currencySymbol}{monthlySalary.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('dashboard.potentialSavings')}</p>
              <p className="font-display text-lg font-semibold text-success">
                {currencySymbol}{Math.max(0, monthlySalary - monthlyExpenses).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
