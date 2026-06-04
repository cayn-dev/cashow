import { SavingsGoal } from '@/types/finance';
import { useLanguage } from '@/hooks/useLanguage';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDeposit: (id: string, amount: number) => void;
  onWithdraw: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  currencySymbol?: string;
}

export function SavingsGoalCard({ goal, onDeposit, onWithdraw, onDelete, currencySymbol = '€' }: SavingsGoalCardProps) {
  const { t } = useLanguage();
  const [amountInput, setAmountInput] = useState('50');
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isComplete = percentage >= 100;

  const parsedAmount = Math.max(0, parseFloat(amountInput) || 0);

  const handleDeposit = () => {
    if (parsedAmount <= 0) return;
    onDeposit(goal.id, parsedAmount);
  };

  const handleWithdraw = () => {
    if (parsedAmount <= 0 || goal.currentAmount < parsedAmount) return;
    onWithdraw(goal.id, -parsedAmount);
  };

  return (
    <GlassCard className="animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{goal.emoji}</span>
          <div>
            <h3 className="font-display font-semibold text-foreground">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">
              {currencySymbol}{goal.currentAmount.toLocaleString()} / {currencySymbol}{goal.targetAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(goal.id)}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative mb-4">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out animate-progress',
              isComplete ? 'bg-success' : 'bg-primary'
            )}
            style={{
              width: `${percentage}%`,
              boxShadow: isComplete ? '0 0 10px hsl(var(--success))' : '0 0 10px hsl(var(--primary))',
            }}
          />
        </div>
        <span className={cn('absolute right-0 -top-6 text-sm font-medium', isComplete ? 'text-success' : 'text-primary')}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {isComplete && (
        <div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20">
          <p className="text-sm text-success font-medium text-center">{t('savings.goalReached')}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">{t('savings.amountLabel')} ({currencySymbol})</label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="bg-muted/50 border-card-border flex-1"
            placeholder="0.00"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeposit}
            disabled={parsedAmount <= 0}
            className="border-success/30 text-success hover:bg-success/10 hover:text-success"
          >
            <Plus className="w-4 h-4 mr-1" /> {t('savings.deposit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWithdraw}
            disabled={parsedAmount <= 0 || goal.currentAmount < parsedAmount}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Minus className="w-4 h-4 mr-1" /> {t('savings.withdraw')}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
