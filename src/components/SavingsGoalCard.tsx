import { SavingsGoal } from '@/types/finance';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDeposit: (id: string, amount: number) => void;
  onWithdraw: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  currencySymbol?: string;
}

export function SavingsGoalCard({ goal, onDeposit, onWithdraw, onDelete, currencySymbol = '€' }: SavingsGoalCardProps) {
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isComplete = percentage >= 100;

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
              boxShadow: isComplete 
                ? '0 0 10px hsl(var(--success))' 
                : '0 0 10px hsl(var(--primary))'
            }}
          />
        </div>
        <span className={cn(
          'absolute right-0 -top-6 text-sm font-medium',
          isComplete ? 'text-success' : 'text-primary'
        )}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {isComplete && (
        <div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20">
          <p className="text-sm text-success font-medium text-center">
            🎉 Obiettivo raggiunto! Complimenti!
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeposit(goal.id, 50)}
          className="flex-1 border-success/30 text-success hover:bg-success/10 hover:text-success"
        >
          <Plus className="w-4 h-4 mr-1" /> {currencySymbol}50
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWithdraw(goal.id, -50)}
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={goal.currentAmount < 50}
        >
          <Minus className="w-4 h-4 mr-1" /> {currencySymbol}50
        </Button>
      </div>
    </GlassCard>
  );
}
