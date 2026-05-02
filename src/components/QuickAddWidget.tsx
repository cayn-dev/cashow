import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeedback } from '@/hooks/useFeedback';
import { Transaction, autoCategorizeTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';

interface QuickAddWidgetProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  currencySymbol?: string;
}

export function QuickAddWidget({ onAddTransaction, currencySymbol = '€' }: QuickAddWidgetProps) {
  const { t } = useLanguage();
  const feedback = useFeedback();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setAmount('');
    setDescription('');
  };

  const handleAdd = () => {
    const value = parseFloat(amount);
    if (!value || !description.trim()) return;
    const auto = autoCategorizeTransaction(description);
    const finalType = auto?.type || type;
    onAddTransaction({
      type: finalType,
      amount: value,
      category: auto?.category || (finalType === 'income' ? 'salary' : 'other'),
      description: description.trim(),
      date: new Date(),
      paymentMethod: 'card',
      recurrence: 'none',
      isSalary: auto?.category === 'salary',
    });
    feedback.success();
    reset();
  };

  return (
    <GlassCard className="p-4 sm:p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-base flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          {t('quickAdd.title')}
        </h3>
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/[0.04] border border-white/10">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors',
              type === 'expense' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingDown className="w-3 h-3" /> {t('quickAdd.expense')}
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors',
              type === 'income' ? 'bg-success/20 text-success' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingUp className="w-3 h-3" /> {t('quickAdd.income')}
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
        className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2"
      >
        <Input
          placeholder={t('quickAdd.what')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-input"
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {currencySymbol}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="glass-input pl-7"
          />
        </div>
        <motion.div whileTap={{ scale: 0.96 }}>
          <Button
            type="submit"
            disabled={!amount || !description.trim()}
            className={cn(
              'w-full sm:w-auto rounded-xl font-semibold',
              type === 'expense'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-success text-success-foreground hover:bg-success/90'
            )}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('quickAdd.add')}
          </Button>
        </motion.div>
      </form>
    </GlassCard>
  );
}
