import { SavingsGoal } from '@/types/finance';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { GlassCard } from '@/components/GlassCard';
import { StatCard } from '@/components/StatCard';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  totalSavings: number;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  currencySymbol?: string;
}

export function SavingsView({
  savingsGoals,
  totalSavings,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  currencySymbol = '€',
}: SavingsViewProps) {
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedGoals = savingsGoals.filter(
    g => g.currentAmount >= g.targetAmount
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Risparmi</h1>
          <p className="text-muted-foreground">
            Monitora i tuoi obiettivi di risparmio
          </p>
        </div>
        <AddGoalDialog onAdd={onAddGoal} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Totale Risparmiato"
          value={`${currencySymbol}${totalSavings.toLocaleString()}`}
          icon={PiggyBank}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Obiettivo Totale"
          value={`${currencySymbol}${totalTarget.toLocaleString()}`}
          subtitle={`${savingsGoals.length} obiettivi attivi`}
          icon={Target}
          delay={100}
        />
        <StatCard
          title="Obiettivi Raggiunti"
          value={completedGoals.toString()}
          subtitle={`su ${savingsGoals.length} totali`}
          icon={TrendingUp}
          variant={completedGoals > 0 ? 'income' : 'default'}
          delay={200}
        />
      </div>

      {/* Overall Progress */}
      {totalTarget > 0 && (
        <GlassCard glow>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Progresso Generale</span>
              <span className="font-display font-semibold text-primary">
                {((totalSavings / totalTarget) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 animate-progress"
                style={{ 
                  width: `${Math.min((totalSavings / totalTarget) * 100, 100)}%`,
                  boxShadow: '0 0 15px hsl(var(--primary))'
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {currencySymbol}{totalSavings.toLocaleString()} risparmiati su {currencySymbol}{totalTarget.toLocaleString()}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savingsGoals.map((goal) => (
          <SavingsGoalCard
            key={goal.id}
            goal={goal}
            onDeposit={onUpdateGoal}
            onWithdraw={onUpdateGoal}
            onDelete={onDeleteGoal}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>

      {savingsGoals.length === 0 && (
        <GlassCard>
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">
              Nessun obiettivo di risparmio
            </h3>
            <p className="text-muted-foreground mb-4">
              Crea il tuo primo obiettivo per iniziare a risparmiare!
            </p>
            <AddGoalDialog onAdd={onAddGoal} />
          </div>
        </GlassCard>
      )}

      {/* Tips */}
      <GlassCard>
        <h3 className="font-display font-semibold text-lg mb-4">💡 Consigli per Risparmiare</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30">
            <h4 className="font-medium mb-1">Regola del 50/30/20</h4>
            <p className="text-sm text-muted-foreground">
              Destina il 50% alle necessità, 30% ai desideri e 20% ai risparmi.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30">
            <h4 className="font-medium mb-1">Risparmio Automatico</h4>
            <p className="text-sm text-muted-foreground">
              Imposta un bonifico automatico appena ricevi lo stipendio.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
