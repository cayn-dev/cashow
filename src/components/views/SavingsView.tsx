import { SavingsGoal } from '@/types/finance';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { GlassCard } from '@/components/GlassCard';
import { GlassEmptyState } from '@/components/ui/glass-empty-state';
import { StatCard } from '@/components/StatCard';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  totalSavings: number;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  currencySymbol?: string;
}

export function SavingsView({ savingsGoals, totalSavings, onAddGoal, onUpdateGoal, onDeleteGoal, currencySymbol = '€' }: SavingsViewProps) {
  const { t } = useLanguage();
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedGoals = savingsGoals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('savings.title')}</h1>
          <p className="text-muted-foreground">{t('savings.subtitle')}</p>
        </div>
        <AddGoalDialog onAdd={onAddGoal} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t('savings.totalSaved')} value={`${currencySymbol}${totalSavings.toLocaleString()}`} icon={PiggyBank} variant="primary" delay={0} />
        <StatCard title={t('savings.totalGoal')} value={`${currencySymbol}${totalTarget.toLocaleString()}`} subtitle={t('savings.activeGoals', { count: String(savingsGoals.length) })} icon={Target} delay={100} />
        <StatCard title={t('savings.goalsReached')} value={completedGoals.toString()} subtitle={t('savings.ofTotal', { count: String(savingsGoals.length) })} icon={TrendingUp} variant={completedGoals > 0 ? 'income' : 'default'} delay={200} />
      </div>

      {totalTarget > 0 && (
        <GlassCard glow>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('savings.overallProgress')}</span>
              <span className="font-display font-semibold text-primary">{((totalSavings / totalTarget) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000 animate-progress" style={{ width: `${Math.min((totalSavings / totalTarget) * 100, 100)}%`, boxShadow: '0 0 15px hsl(var(--primary))' }} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('savings.savedOf', { saved: `${currencySymbol}${totalSavings.toLocaleString()}`, total: `${currencySymbol}${totalTarget.toLocaleString()}` })}
            </p>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savingsGoals.map((goal) => (
          <SavingsGoalCard key={goal.id} goal={goal} onDeposit={onUpdateGoal} onWithdraw={onUpdateGoal} onDelete={onDeleteGoal} currencySymbol={currencySymbol} />
        ))}
      </div>

      {savingsGoals.length === 0 && (
        <GlassCard hover={false}>
          <GlassEmptyState
            icon={Target}
            title={t('savings.noGoals')}
            description={t('savings.createFirst')}
            action={<AddGoalDialog onAdd={onAddGoal} />}
          />
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="font-display font-semibold text-lg mb-4">{t('savings.tipsTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30">
            <h4 className="font-medium mb-1">{t('savings.tip1Title')}</h4>
            <p className="text-sm text-muted-foreground">{t('savings.tip1Desc')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30">
            <h4 className="font-medium mb-1">{t('savings.tip2Title')}</h4>
            <p className="text-sm text-muted-foreground">{t('savings.tip2Desc')}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
