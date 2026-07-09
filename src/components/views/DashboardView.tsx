import { useEffect, useState } from 'react';
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
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';
import { GlassEmptyState } from '@/components/ui/glass-empty-state';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
  onUpdateTransaction?: (id: string, updates: Omit<Transaction, 'id'>) => void;
  onViewTransactions: () => void;
  currencySymbol?: string;
  openAddTxTick?: number;
}

const GREETINGS: Record<string, [string, string, string, string]> = {
  it: ['Buonanotte', 'Buongiorno', 'Buon pomeriggio', 'Buonasera'],
  en: ['Good night', 'Good morning', 'Good afternoon', 'Good evening'],
  es: ['Buenas noches', 'Buenos días', 'Buenas tardes', 'Buenas noches'],
  fr: ['Bonne nuit', 'Bonjour', 'Bon après-midi', 'Bonsoir'],
  de: ['Gute Nacht', 'Guten Morgen', 'Guten Tag', 'Guten Abend'],
};
function greetingFor(lang: string): string {
  const h = new Date().getHours();
  const idx = h < 6 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3;
  return (GREETINGS[lang] || GREETINGS.en)[idx];
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
  onUpdateTransaction,
  onViewTransactions,
  currencySymbol = '€',
  openAddTxTick = 0,
}: DashboardViewProps) {
  const insights = useInsights(allTransactions);
  const { t, language } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (openAddTxTick > 0) setAddOpen(true);
  }, [openAddTxTick]);

  const greeting = greetingFor(language);
  const savingsRate =
    monthlyIncome > 0 ? Math.max(0, Math.min(100, (monthlyBalance / monthlyIncome) * 100)) : 0;

  return (
    <div className="space-y-8">
      {/* ===== Editorial hero ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden noir-card p-6 sm:p-10"
      >
        {/* Ornament */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 blur-3xl"
             style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.7), transparent 65%)' }} />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-3 h-3 text-primary" />
              {greeting}
            </div>
            <h1 className="font-display italic text-4xl sm:text-5xl xl:text-6xl leading-[0.95] tracking-tight text-foreground">
              {t('dashboard.title')}
              <span className="text-gold">.</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl font-sans">
              {t('dashboard.subtitle')}
            </p>
            <div className="divider-gold mt-5 w-24" />
          </div>

          {/* Hero balance card */}
          <div className="shrink-0 sm:min-w-[260px]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {t('dashboard.monthlyBalance')}
            </div>
            <div
              className="font-display italic text-5xl sm:text-6xl leading-none tracking-tight text-gold sensitive-amount"
              data-sensitive
            >
              {currencySymbol}
              {monthlyBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${savingsRate}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: 'var(--gradient-gold)' }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums font-sans">
                {savingsRate.toFixed(0)}%
              </span>
            </div>
            <div className="mt-4">
              <AddTransactionDialog onAdd={onAddTransaction} open={addOpen} onOpenChange={setAddOpen} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== Stats grid ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.monthlyIncome')}
          value={`${currencySymbol}${monthlyIncome.toLocaleString()}`}
          icon={TrendingUp}
          variant="income"
          delay={0}
          onClick={onViewTransactions}
        />
        <StatCard
          title={t('dashboard.monthlyExpenses')}
          value={`${currencySymbol}${monthlyExpenses.toLocaleString()}`}
          icon={TrendingDown}
          variant="expense"
          delay={80}
          onClick={onViewTransactions}
        />
        <StatCard
          title={t('dashboard.totalSavings')}
          value={`${currencySymbol}${totalSavings.toLocaleString()}`}
          icon={PiggyBank}
          variant="primary"
          delay={160}
        />
        <StatCard
          title={t('dashboard.monthlySalary')}
          value={`${currencySymbol}${monthlySalary.toLocaleString()}`}
          icon={Wallet}
          variant="primary"
          delay={240}
        />
      </div>

      {/* ===== Two-column ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ExpenseChart data={expensesByCategory} transactions={allTransactions} />
        </div>
        <GlassCard className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display italic text-2xl">{t('dashboard.recentTransactions')}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewTransactions}
              className="text-primary hover:text-primary-glow hover:bg-primary/10"
            >
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onDelete={onDeleteTransaction}
                onEdit={onUpdateTransaction}
                currencySymbol={currencySymbol}
              />
            ))}
            {recentTransactions.length === 0 && (
              <GlassEmptyState
                icon={Receipt}
                title={t('dashboard.noTransactions')}
                description={t('dashboard.subtitle')}
                compact
              />
            )}
          </div>
        </GlassCard>
      </div>

      {insights.length > 0 && (
        <GlassCard className="animate-slide-up">
          <InsightsPanel insights={insights} />
        </GlassCard>
      )}

      <AIChatDialog
        transactions={allTransactions}
        savingsGoals={savingsGoals}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyBalance={monthlyBalance}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
