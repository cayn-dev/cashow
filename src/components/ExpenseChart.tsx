import { CategoryType, CATEGORY_CONFIG, Transaction } from '@/types/finance';
import { GlassCard } from './GlassCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface ExpenseChartProps {
  data: Record<CategoryType, number>;
  transactions?: Transaction[];
}

const COLORS = [
  'hsl(211, 100%, 50%)',
  'hsl(280, 80%, 60%)',
  'hsl(25, 100%, 55%)',
  'hsl(145, 80%, 50%)',
  'hsl(320, 80%, 60%)',
  'hsl(45, 100%, 50%)',
  'hsl(0, 0%, 55%)',
];

type ChartMode = 'donut' | 'trend';

export function ExpenseChart({ data, transactions = [] }: ExpenseChartProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<ChartMode>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_CONFIG[category as CategoryType].label,
      value,
      emoji: CATEGORY_CONFIG[category as CategoryType].emoji,
      category,
    }))
    .sort((a, b) => b.value - a.value);

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  // Build trend data: daily expenses & income for last 30 days
  const trendData = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 29);
    const days = eachDayOfInterval({ start, end: today });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      let expenses = 0;
      let income = 0;
      transactions.forEach(tx => {
        const txDay = format(new Date(tx.date), 'yyyy-MM-dd');
        if (txDay === dayStr) {
          if (tx.type === 'expense') expenses += tx.amount;
          else income += tx.amount;
        }
      });
      return {
        date: format(day, 'dd/MM'),
        expenses,
        income,
      };
    });
  }, [transactions]);

  if (chartData.length === 0 && mode === 'donut') {
    return (
      <GlassCard className="h-full">
        <h3 className="font-display font-semibold text-lg mb-4">{t('chart.expensesByCategory')}</h3>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          {t('chart.noExpenses')}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">
          {mode === 'donut' ? t('chart.expensesByCategory') : t('chart.trend')}
        </h3>
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
          <button
            onClick={() => setMode('donut')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              mode === 'donut' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('chart.donut')}
          </button>
          <button
            onClick={() => setMode('trend')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              mode === 'trend' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('chart.trendLabel')}
          </button>
        </div>
      </div>

      {mode === 'donut' ? (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-[180px] h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      style={{ transition: 'opacity 0.2s ease' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="glass-panel p-2.5 text-sm rounded-xl shadow-lg border border-card-border">
                          <span className="font-medium">{d.emoji} {d.name}</span>
                          <div className="text-primary font-bold">€{d.value.toLocaleString()}</div>
                          <div className="text-muted-foreground text-xs">{((d.value / total) * 100).toFixed(1)}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">{t('chart.total')}</span>
              <span className="font-display font-bold text-lg">€{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full">
            {chartData.map((item, index) => {
              const pct = ((item.value / total) * 100);
              return (
                <div
                  key={item.name}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-xl transition-all cursor-default',
                    activeIndex === index ? 'bg-muted/50' : ''
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{item.emoji} {item.name}</span>
                      <span className="font-medium ml-2">€{item.value.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                          opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground">
              {t('chart.noExpenses')}
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-2.5 text-sm rounded-xl shadow-lg border border-card-border">
                            <div className="font-medium mb-1">{label}</div>
                            {payload.map((p: any) => (
                              <div key={p.dataKey} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                                <span className="text-muted-foreground">
                                  {p.dataKey === 'expenses' ? t('chart.expenses') : t('chart.income')}:
                                </span>
                                <span className="font-bold">€{p.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(280, 80%, 60%)"
                    strokeWidth={2.5}
                    fill="url(#expenseGrad)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(280, 80%, 60%)', fill: 'hsl(0 0% 8%)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(211, 100%, 50%)"
                    strokeWidth={2.5}
                    fill="url(#incomeGrad)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(211, 100%, 50%)', fill: 'hsl(0 0% 8%)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(280, 80%, 60%)' }} />
              <span className="text-muted-foreground">{t('chart.expenses')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(211, 100%, 50%)' }} />
              <span className="text-muted-foreground">{t('chart.income')}</span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
