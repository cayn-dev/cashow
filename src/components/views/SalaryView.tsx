import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { GlassCard } from '@/components/GlassCard';
import { StatCard } from '@/components/StatCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  TrendingUp, 
  Calculator,
  LineChart
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface SalaryViewProps {
  monthlySalary: number;
  cumulativeSalary: number;
  salaryTransactions: Transaction[];
  onSetMonthlySalary: (salary: number) => void;
  currencySymbol?: string;
}

export function SalaryView({
  monthlySalary,
  cumulativeSalary,
  salaryTransactions,
  onSetMonthlySalary,
  currencySymbol = '€',
}: SalaryViewProps) {
  const [newSalary, setNewSalary] = useState(monthlySalary.toString());

  const handleUpdateSalary = () => {
    const salary = parseFloat(newSalary);
    if (!isNaN(salary) && salary >= 0) {
      onSetMonthlySalary(salary);
    }
  };

  // Build cumulative chart data
  const sortedSalaries = [...salaryTransactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  let runningTotal = 0;
  const chartData = sortedSalaries.map((t) => {
    runningTotal += t.amount;
    return {
      date: format(t.date, 'MMM yy', { locale: it }),
      amount: t.amount,
      cumulative: runningTotal,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Stipendio</h1>
        <p className="text-muted-foreground">
          Gestisci e monitora i tuoi guadagni
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Stipendio Mensile"
          value={`${currencySymbol}${monthlySalary.toLocaleString()}`}
          icon={Wallet}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Stipendio Cumulativo"
          value={`${currencySymbol}${cumulativeSalary.toLocaleString()}`}
          subtitle="Totale guadagnato"
          icon={TrendingUp}
          variant="income"
          delay={100}
        />
        <StatCard
          title="Media Mensile"
          value={`${currencySymbol}${salaryTransactions.length > 0 
            ? Math.round(cumulativeSalary / salaryTransactions.length).toLocaleString() 
            : '0'}`}
          icon={Calculator}
          delay={200}
        />
      </div>

      {/* Update Salary */}
      <GlassCard>
        <h3 className="font-display font-semibold text-lg mb-4">
          Modifica Stipendio Mensile
        </h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="newSalary">Nuovo importo ({currencySymbol})</Label>
            <Input
              id="newSalary"
              type="number"
              step="0.01"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              className="bg-muted/50 border-card-border text-lg font-display"
              placeholder="0.00"
            />
          </div>
          <Button 
            onClick={handleUpdateSalary}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Aggiorna
          </Button>
        </div>
      </GlassCard>

      {/* Cumulative Chart */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <LineChart className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">
            Andamento Stipendio Cumulativo
          </h3>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(0, 0%, 40%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(0, 0%, 40%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-3">
                          <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
                          <p className="text-sm font-medium">
                            Stipendio: <span className="text-success">{currencySymbol}{payload[0].payload.amount.toLocaleString()}</span>
                          </p>
                          <p className="text-sm font-medium">
                            Totale: <span className="text-primary">{currencySymbol}{payload[0].payload.cumulative.toLocaleString()}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(185, 100%, 50%)"
                  strokeWidth={2}
                  fill="url(#colorCumulative)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nessuno stipendio registrato</p>
              <p className="text-sm">Aggiungi una transazione come "stipendio"</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Salary History */}
      <GlassCard>
        <h3 className="font-display font-semibold text-lg mb-4">
          Storico Stipendi
        </h3>
        <div className="space-y-3">
          {salaryTransactions.slice(0, 6).map((t) => (
            <div 
              key={t.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(t.date, 'd MMMM yyyy', { locale: it })}
                  </p>
                </div>
              </div>
              <span className="font-display font-semibold text-lg text-success">
                +{currencySymbol}{t.amount.toLocaleString()}
              </span>
            </div>
          ))}

          {salaryTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nessuno stipendio registrato
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
