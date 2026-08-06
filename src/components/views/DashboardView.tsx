import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { ExpenseChart } from '@/components/ExpenseChart';
import { TransactionItem } from '@/components/TransactionItem';
import { GlassCard } from '@/components/GlassCard';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { InsightsPanel } from '@/components/InsightsPanel';
import { AIChatDialog } from '@/components/AIChatDialog';
import { MonthlyLimitCard } from '@/components/MonthlyLimitCard';
import { useInsights } from '@/hooks/useInsights';
import { useLanguage } from '@/hooks/useLanguage';
import { useSettings } from '@/hooks/useSettings';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowRight,
  Sparkles,
  Settings2,
  Check,
  EyeOff,
  Plus,
  RotateCcw,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Receipt,
} from 'lucide-react';
import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';
import { GlassEmptyState } from '@/components/ui/glass-empty-state';
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

/** Ordered list of every widget available on the dashboard. */
const DEFAULT_WIDGETS = ['hero', 'stats', 'limit', 'chart', 'recent', 'insights'] as const;
type WidgetId = (typeof DEFAULT_WIDGETS)[number];

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
  const settings = useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (openAddTxTick > 0) setAddOpen(true);
  }, [openAddTxTick]);

  const greeting = greetingFor(language);
  const savingsRate =
    monthlyIncome > 0 ? Math.max(0, Math.min(100, (monthlyBalance / monthlyIncome) * 100)) : 0;

  const monthSpent = useMemo(
    () => recentTransactions.filter(tr => tr.type === 'expense').reduce((s, tr) => s + tr.amount, 0),
    [recentTransactions],
  );

  // ===== Layout state =====
  const hidden = settings.dashboardHiddenWidgets;
  const order = useMemo<string[]>(() => {
    const saved = settings.dashboardWidgets.filter(w => (DEFAULT_WIDGETS as readonly string[]).includes(w));
    const missing = DEFAULT_WIDGETS.filter(w => !saved.includes(w));
    return [...saved, ...missing];
  }, [settings.dashboardWidgets]);

  const visible = order.filter(w => !hidden.includes(w));

  const hideWidget = (id: string) => settings.setHiddenDashboardWidgets([...hidden, id]);
  const showWidget = (id: string) =>
    settings.setHiddenDashboardWidgets(hidden.filter(h => h !== id));

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...order];
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    settings.setDashboardWidgets(next);
    setDragId(null);
  };

  const widgetLabel = (id: string) => t(`dash.w.${id === 'hero' ? 'hero' : id === 'stats' ? 'stats' : id === 'limit' ? 'limit' : id === 'chart' ? 'chart' : id === 'recent' ? 'recent' : 'insights'}`);

  // ===== Widget renderers =====
  const renderWidget = (id: string) => {
    switch (id) {
      case 'hero':
        return (
          <section className="relative overflow-hidden noir-card p-6 sm:p-10">
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.7), transparent 65%)' }}
            />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground flex items-center gap-2 mb-3">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {greeting}
                </div>
                <p className="mt-1 text-muted-foreground max-w-xl font-sans">{t('dashboard.subtitle')}</p>
                <div className="divider-gold mt-5 w-24" />
              </div>

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
          </section>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title={t('dashboard.monthlyIncome')}
              value={`${currencySymbol}${monthlyIncome.toLocaleString()}`}
              icon={TrendingUp}
              variant="income"
              delay={0}
              onClick={editMode ? undefined : onViewTransactions}
            />
            <StatCard
              title={t('dashboard.monthlyExpenses')}
              value={`${currencySymbol}${monthlyExpenses.toLocaleString()}`}
              icon={TrendingDown}
              variant="expense"
              delay={80}
              onClick={editMode ? undefined : onViewTransactions}
            />
            <StatCard
              title={t('dashboard.totalSavings')}
              value={`${currencySymbol}${totalSavings.toLocaleString()}`}
              icon={PiggyBank}
              variant="primary"
              delay={160}
            />
            <StatCard
              title={t(`salary.label.${settings.salaryFrequency}`)}
              value={`${currencySymbol}${monthlySalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtitle={t('salary.netMonthlyBase')}
              icon={Wallet}
              variant="primary"
              delay={240}
            />
          </div>
        );

      case 'limit':
        return settings.monthlySpendingLimit > 0 ? (
          <MonthlyLimitCard
            spent={monthSpent}
            limit={settings.monthlySpendingLimit}
            currencySymbol={currencySymbol}
          />
        ) : null;

      case 'chart':
        return <ExpenseChart data={expensesByCategory} transactions={allTransactions} />;

      case 'recent':
        return (
          <GlassCard>
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
              {recentTransactions.slice(0, 5).map(transaction => (
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
        );

      case 'insights':
        return insights.length > 0 ? (
          <GlassCard>
            <InsightsPanel insights={insights} />
          </GlassCard>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* ===== Fixed header ===== */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="font-display italic text-4xl sm:text-5xl xl:text-6xl leading-[0.95] tracking-tight text-foreground">
          {t('dashboard.title')}
          <span className="text-gold">.</span>
        </h1>
        <div className="flex items-center gap-2">
          {editMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                settings.resetDashboardLayout();
              }}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dash.resetLayout')}</span>
            </Button>
          )}
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(v => !v)}
            className="gap-2"
            aria-label={editMode ? t('dash.done') : t('dash.customize')}
          >
            {editMode ? <Check className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{editMode ? t('dash.done') : t('dash.customize')}</span>
          </Button>
        </div>
      </div>

      {/* ===== Hidden widgets panel ===== */}
      {editMode && (
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">{t('dash.hidden')}</h3>
          {hidden.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hidden.map(id => (
                <Button key={id} variant="outline" size="sm" className="gap-2" onClick={() => showWidget(id)}>
                  <Plus className="w-3 h-3" />
                  {widgetLabel(id)}
                </Button>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* ===== Widgets ===== */}
      {visible.map(id => {
        const content = renderWidget(id);
        if (!content && !editMode) return null;
        return (
          <div
            key={id}
            draggable={editMode}
            onDragStart={() => setDragId(id)}
            onDragOver={e => editMode && e.preventDefault()}
            onDrop={() => handleDrop(id)}
            className={
              editMode
                ? 'relative rounded-3xl ring-1 ring-primary/30 ring-offset-2 ring-offset-background p-1 cursor-grab active:cursor-grabbing'
                : 'relative'
            }
          >
            {editMode && (
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  {widgetLabel(id)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  aria-label={t('dash.hide')}
                  onClick={() => hideWidget(id)}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className={editMode ? 'pointer-events-none opacity-90' : undefined}>
              {content || (
                <GlassCard>
                  <p className="text-xs text-muted-foreground">{widgetLabel(id)}</p>
                </GlassCard>
              )}
            </div>
          </div>
        );
      })}

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
