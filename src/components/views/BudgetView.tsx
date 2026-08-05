import { useState } from 'react';
import { motion } from 'framer-motion';
import { Transaction, CATEGORY_CONFIG, CategoryType } from '@/types/finance';
import { GlassCard } from '@/components/GlassCard';
import { BudgetProgressList } from '@/components/BudgetProgressList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { Plus, Trash2, Wallet, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyLimitCard } from '@/components/MonthlyLimitCard';


interface BudgetViewProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

export function BudgetView({ transactions, currencySymbol = '€' }: BudgetViewProps) {
  const settings = useSettings();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CategoryType>('food');
  const [limit, setLimit] = useState('');
  const [limitInput, setLimitInput] = useState(
    settings.monthlySpendingLimit ? String(settings.monthlySpendingLimit) : '',
  );

  const now = new Date();
  const monthSpent = transactions
    .filter(
      tr =>
        tr.type === 'expense' &&
        tr.date.getMonth() === now.getMonth() &&
        tr.date.getFullYear() === now.getFullYear(),
    )
    .reduce((sum, tr) => sum + tr.amount, 0);

  const handleSaveLimit = () => {
    const n = parseFloat(limitInput);
    if (isNaN(n) || n < 0) {
      toast.error(t('budget.invalidAmount'));
      return;
    }
    settings.setMonthlySpendingLimit(n);
    toast.success(t('budget.limitSaved'));
  };


  const expenseCategories = Object.entries(CATEGORY_CONFIG).filter(
    ([key]) => !['salary', 'freelance', 'investments'].includes(key),
  ) as [CategoryType, typeof CATEGORY_CONFIG[CategoryType]][];

  const handleAdd = () => {
    const n = parseFloat(limit);
    if (!n || n <= 0) {
      toast.error(t('budget.invalidAmount'));
      return;
    }
    settings.setCategoryBudget(category, n, true);
    toast.success(t('budget.saved'));
    setLimit('');
    setOpen(false);
  };

  const handleDelete = (cat: string) => {
    settings.setCategoryBudget(cat, 0, false);
    toast.success(t('budget.removed'));
  };

  const handleToggle = (cat: string, enabled: boolean) => {
    const existing = settings.categoryBudgets.find(b => b.category === cat);
    if (existing) {
      settings.setCategoryBudget(cat, existing.limit, enabled);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div>
          <h1 className="font-display text-3xl font-bold">{t('budget.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('budget.pageSubtitle')}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('budget.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-elevated max-w-md">
            <DialogHeader>
              <DialogTitle>{t('budget.add')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('budget.category')}</label>
                <Select value={category} onValueChange={v => setCategory(v as CategoryType)}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-panel max-h-[300px]">
                    {expenseCategories.map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.emoji} {t(`cat.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('budget.monthlyLimit')} ({currencySymbol})
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="200"
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                {t('budget.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Overall monthly spending limit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <GlassCard>
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            {t('budget.overallLimit')}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">{t('budget.overallLimitDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="1200"
              value={limitInput}
              onChange={e => setLimitInput(e.target.value)}
              className="bg-muted/50"
            />
            <Button onClick={handleSaveLimit} className="shrink-0">
              {t('budget.setLimit')}
            </Button>
          </div>
        </GlassCard>

        <MonthlyLimitCard
          spent={monthSpent}
          limit={settings.monthlySpendingLimit}
          currencySymbol={currencySymbol}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <BudgetProgressList
          transactions={transactions}
          budgets={settings.categoryBudgets}
          currencySymbol={currencySymbol}
        />
      </motion.div>


      {settings.categoryBudgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {t('budget.manage')}
            </h3>
            <div className="space-y-2">
              {settings.categoryBudgets.map(b => {
                const cfg = CATEGORY_CONFIG[b.category as CategoryType];
                return (
                  <div
                    key={b.category}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{cfg?.emoji ?? '📦'}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {cfg?.label ?? b.category}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {currencySymbol}
                          {b.limit.toFixed(0)} / {t('budget.monthSuffix')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={b.enabled}
                        onCheckedChange={c => handleToggle(b.category, c)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(b.category)}
                        className="text-destructive hover:bg-destructive/10"
                        aria-label={t('budget.deleteBudget') || 'Delete budget'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
