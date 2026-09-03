import { CategoryType, Transaction, resolveCategoryMeta } from '@/types/finance';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { GlassCard } from './GlassCard';
import { GlassEmptyState } from '@/components/ui/glass-empty-state';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';

interface ExpenseChartProps {
  data: Record<CategoryType, number>;
  transactions?: Transaction[];
}

/** Chart colors are driven by CSS design tokens (--chart-1..7) */
const CHART_HSL = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
];
const INCOME_COLOR = 'hsl(var(--success))';
const EXPENSE_COLOR = 'hsl(var(--chart-3))';

type ChartMode = 'donut' | 'trend';

export function ExpenseChart({ data, transactions = [] }: ExpenseChartProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<ChartMode>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { categories: customCategories } = useCustomCategories();

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: resolveCategoryMeta(category, customCategories).label,
      value,
      emoji: resolveCategoryMeta(category, customCategories).emoji,
      category,
    }))
    .sort((a, b) => b.value - a.value);

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  const trendData = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 29);
    const days = eachDayOfInterval({ start, end: today });
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      let expenses = 0;
      let income = 0;
      transactions.forEach((tx) => {
        const txDay = format(new Date(tx.date), 'yyyy-MM-dd');
        if (txDay === dayStr) {
          if (tx.type === 'expense') expenses += tx.amount;
          else income += tx.amount;
        }
      });
      return { date: format(day, 'dd/MM'), expenses, income };
    });
  }, [transactions]);

  const Header = (
    <div className="flex items-center justify-between mb-5">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
          {t('chart.overview') || 'Overview'}
        </div>
        <h3 className="font-display font-bold text-xl leading-none tracking-tight">
          {mode === 'donut' ? t('chart.expensesByCategory') : t('chart.trend')}
        </h3>
      </div>
      <div className="segmented shrink-0">
        <button data-active={mode === 'donut'} onClick={() => setMode('donut')}>
          {t('chart.donut')}
        </button>
        <button data-active={mode === 'trend'} onClick={() => setMode('trend')}>
          {t('chart.trendLabel')}
        </button>
      </div>
    </div>
  );

  if (chartData.length === 0 && mode === 'donut') {
    return (
      <GlassCard className="h-full" elevated>
        {Header}
      <div className="h-[220px] flex items-center justify-center">
          <GlassEmptyState icon={PieIcon} title={t('chart.noExpenses')} compact />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full" elevated>
      {Header}

      <AnimatePresence mode="wait">
        {mode === 'donut' ? (
          <motion.div
            key="donut"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="w-[200px] h-[200px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    animationBegin={0}
                    animationDuration={900}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_HSL[index % CHART_HSL.length]}
                        stroke="transparent"
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                        style={{ transition: 'opacity 0.25s ease' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as (typeof chartData)[number];
                        return (
                          <div className="glass-tooltip px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 font-medium">
                              <span>{d.emoji}</span>
                              <span>{d.name}</span>
                            </div>
                            <div className="mt-1 font-display font-bold text-base text-shine">
                              €{d.value.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground text-[11px] tabular-nums">
                              {((d.value / total) * 100).toFixed(1)}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t('chart.total')}
                </span>
                <span className="font-display font-bold text-xl text-shine mt-0.5">
                  €{total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              {chartData.map((item, index) => {
                const pct = (item.value / total) * 100;
                const color = CHART_HSL[index % CHART_HSL.length];
                const isActive = activeIndex === index;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-xl transition-all cursor-default',
                      isActive && 'bg-white/[0.04]'
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: color,
                        boxShadow: isActive ? `0 0 12px ${color}` : 'none',
                        transition: 'box-shadow 0.25s ease',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">
                          <span className="mr-1">{item.emoji}</span>
                          {item.name}
                        </span>
                        <span className="font-medium tabular-nums ml-2">
                          €{item.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + index * 0.03 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: color,
                            opacity: activeIndex === null || isActive ? 1 : 0.4,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="trend"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {transactions.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center">
                <GlassEmptyState icon={LineIcon} title={t('chart.noExpenses')} compact />
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--chart-grid))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--chart-axis))', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--chart-axis))', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--primary) / 0.4)', strokeDasharray: '3 3' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-tooltip px-3 py-2 text-sm min-w-[140px]">
                              <div className="font-medium mb-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                                {label}
                              </div>
                              {payload.map((p: any) => (
                                <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: p.stroke, boxShadow: `0 0 8px ${p.stroke}` }}
                                  />
                                  <span className="text-muted-foreground text-xs flex-1">
                                    {p.dataKey === 'expenses' ? t('chart.expenses') : t('chart.income')}
                                  </span>
                                  <span className="font-bold tabular-nums">€{p.value.toLocaleString()}</span>
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
                      stroke={EXPENSE_COLOR}
                      strokeWidth={2.5}
                      fill="url(#expenseGrad)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: EXPENSE_COLOR, fill: 'hsl(var(--background))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke={INCOME_COLOR}
                      strokeWidth={2.5}
                      fill="url(#incomeGrad)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: INCOME_COLOR, fill: 'hsl(var(--background))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLOR, boxShadow: `0 0 10px ${EXPENSE_COLOR}` }} />
                <span className="text-muted-foreground">{t('chart.expenses')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: INCOME_COLOR, boxShadow: `0 0 10px ${INCOME_COLOR}` }} />
                <span className="text-muted-foreground">{t('chart.income')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
