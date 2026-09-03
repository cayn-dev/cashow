import { useMemo } from 'react';
import { Transaction, resolveCategoryMeta } from '@/types/finance';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { GlassCard } from './GlassCard';
import { Progress } from '@/components/ui/progress';
import { CategoryBudget } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { AlertTriangle } from 'lucide-react';

interface BudgetProgressListProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  currencySymbol?: string;
  className?: string;
}

interface BudgetRow {
  category: string;
  limit: number;
  spent: number;
  percent: number;
}

export function BudgetProgressList({
  transactions,
  budgets,
  currencySymbol = '€',
  className,
}: BudgetProgressListProps) {
  const { t } = useLanguage();
  const { categories: customCategories } = useCustomCategories();

  const rows: BudgetRow[] = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const monthExpenses = transactions.filter(
      tx =>
        tx.type === 'expense' &&
        tx.date.getMonth() === m &&
        tx.date.getFullYear() === y,
    );
    const byCat: Record<string, number> = {};
    monthExpenses.forEach(tx => {
      byCat[tx.category] = (byCat[tx.category] || 0) + tx.amount;
    });
    return budgets
      .filter(b => b.enabled && b.limit > 0)
      .map(b => {
        const spent = byCat[b.category] || 0;
        return {
          category: b.category,
          limit: b.limit,
          spent,
          percent: Math.min((spent / b.limit) * 100, 999),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [transactions, budgets]);

  if (rows.length === 0) {
    return (
      <GlassCard className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">{t('budget.empty')}</p>
          <p className="text-xs mt-2 opacity-70">{t('budget.emptyHint')}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={className}>
      <h3 className="font-semibold text-base mb-4">{t('budget.title')}</h3>
      <div className="space-y-4">
        {rows.map(row => {
          const cfg = resolveCategoryMeta(row.category, customCategories);
          const over = row.spent > row.limit;
          const warn = !over && row.percent >= 80;
          const barColor = over
            ? 'bg-destructive'
            : warn
              ? 'bg-warning'
              : 'bg-primary';
          return (
            <div key={row.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{cfg?.emoji ?? '📦'}</span>
                  <span className="font-medium truncate">
                    {cfg?.label ?? row.category}
                  </span>
                  {over && (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  )}
                </div>
                <span
                  className={
                    over
                      ? 'text-destructive font-semibold tabular-nums'
                      : 'text-muted-foreground tabular-nums'
                  }
                >
                  {currencySymbol}
                  {row.spent.toFixed(0)} / {currencySymbol}
                  {row.limit.toFixed(0)}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(row.percent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{row.percent.toFixed(0)}%</span>
                <span>
                  {over
                    ? t('budget.over').replace(
                        '{amount}',
                        `${currencySymbol}${(row.spent - row.limit).toFixed(0)}`,
                      )
                    : t('budget.remaining').replace(
                        '{amount}',
                        `${currencySymbol}${(row.limit - row.spent).toFixed(0)}`,
                      )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
