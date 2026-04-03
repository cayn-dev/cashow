import { CategoryType, CATEGORY_CONFIG } from '@/types/finance';
import { GlassCard } from './GlassCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ExpenseChartProps {
  data: Record<CategoryType, number>;
}

const COLORS = [
  'hsl(211, 100%, 50%)',  // primary blue
  'hsl(280, 80%, 60%)',   // purple
  'hsl(25, 100%, 55%)',   // orange
  'hsl(145, 80%, 50%)',   // green
  'hsl(320, 80%, 60%)',   // pink
  'hsl(45, 100%, 50%)',   // yellow
  'hsl(0, 0%, 55%)',      // gray
];

type ChartMode = 'donut' | 'bar';

export function ExpenseChart({ data }: ExpenseChartProps) {
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

  if (chartData.length === 0) {
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
        <h3 className="font-display font-semibold text-lg">{t('chart.expensesByCategory')}</h3>
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
            onClick={() => setMode('bar')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              mode === 'bar' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('chart.bar')}
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
            {/* Center total */}
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
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="emoji"
                width={30}
                tick={{ fontSize: 16 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="glass-panel p-2.5 text-sm rounded-xl shadow-lg border border-card-border">
                        <span className="font-medium">{d.emoji} {d.name}</span>
                        <div className="text-primary font-bold">€{d.value.toLocaleString()}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
                {chartData.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
