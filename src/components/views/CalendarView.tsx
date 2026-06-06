import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function CalendarView({ transactions, currencySymbol = '€' }: CalendarViewProps) {
  const { t, language } = useLanguage();
  const today = new Date();
  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const locale =
    language === 'it' ? 'it-IT'
    : language === 'es' ? 'es-ES'
    : language === 'fr' ? 'fr-FR'
    : language === 'de' ? 'de-DE'
    : 'en-US';

  const monthLabel = cursor.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  // Build daily aggregates for the cursor month
  const { daily, monthIncome, monthExpense, monthBalance, daysWithData } = useMemo(() => {
    const map = new Map<number, { income: number; expense: number; count: number }>();
    let inc = 0;
    let exp = 0;
    let withData = 0;
    transactions.forEach(t => {
      if (t.date.getMonth() !== cursor.getMonth() || t.date.getFullYear() !== cursor.getFullYear()) return;
      const day = t.date.getDate();
      const cur = map.get(day) ?? { income: 0, expense: 0, count: 0 };
      if (t.type === 'income') {
        cur.income += t.amount;
        inc += t.amount;
      } else {
        cur.expense += t.amount;
        exp += t.amount;
      }
      cur.count += 1;
      map.set(day, cur);
    });
    map.forEach(v => {
      if (v.expense > 0 || v.income > 0) withData += 1;
    });
    return {
      daily: map,
      monthIncome: inc,
      monthExpense: exp,
      monthBalance: inc - exp,
      daysWithData: withData,
    };
  }, [transactions, cursor]);

  // Build cells (with leading blanks based on Monday-first week)
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    // Mon=0..Sun=6
    const firstWeekday = (first.getDay() + 6) % 7;
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= last.getDate(); d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  // End-of-month forecast (only meaningful for current month)
  const isCurrentMonth =
    cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear();

  const forecast = useMemo(() => {
    if (!isCurrentMonth) return null;
    const dayOfMonth = today.getDate();
    const totalDays = endOfMonth(cursor).getDate();
    const remaining = totalDays - dayOfMonth;
    const avgDailyExpense = daysWithData > 0 ? monthExpense / dayOfMonth : 0;
    const projectedExpense = monthExpense + avgDailyExpense * remaining;
    const projectedBalance = monthIncome - projectedExpense;
    return { avgDailyExpense, projectedExpense, projectedBalance, remaining };
  }, [isCurrentMonth, today, cursor, monthExpense, monthIncome, daysWithData]);

  // Heatmap intensity scale
  const maxDayExpense = useMemo(() => {
    let m = 0;
    daily.forEach(v => {
      if (v.expense > m) m = v.expense;
    });
    return m;
  }, [daily]);

  const selectedDayTx = useMemo(() => {
    if (!selectedDay) return [];
    return transactions
      .filter(
        t =>
          t.date.getFullYear() === selectedDay.getFullYear() &&
          t.date.getMonth() === selectedDay.getMonth() &&
          t.date.getDate() === selectedDay.getDate(),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedDay, transactions]);

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
        transition={{ delay: 0.1 }}
      >
        <div>
          <h1 className="font-display text-3xl font-bold">{t('calendar.title')}</h1>
          <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
      </motion.div>

      {/* Month navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label={t('calendar.prevMonth') || 'Previous month'}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label={t('calendar.nextMonth') || 'Next month'}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_KEYS.map(k => (
              <div key={k} className="text-[11px] uppercase tracking-wider text-muted-foreground text-center font-medium">
                {t(`calendar.${k}`)}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`b${i}`} />;
              const data = daily.get(d);
              const intensity =
                maxDayExpense > 0 && data ? Math.min(data.expense / maxDayExpense, 1) : 0;
              const isToday =
                isCurrentMonth && d === today.getDate();
              const cellDate = new Date(cursor.getFullYear(), cursor.getMonth(), d);
              const isSelected = selectedDay && cellDate.toDateString() === selectedDay.toDateString();

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(cellDate)}
                  className={cn(
                    'aspect-square rounded-lg p-1.5 sm:p-2 md:p-2.5 flex flex-col items-start justify-between relative overflow-hidden transition-all duration-200 hover:scale-[1.04]',
                    isToday && 'ring-1 ring-primary',
                    isSelected && 'ring-2 ring-primary',
                  )}
                  style={{
                    background:
                      data && data.expense > 0
                        ? `hsl(var(--destructive) / ${0.08 + intensity * 0.35})`
                        : data && data.income > 0
                          ? 'hsl(var(--success) / 0.10)'
                          : 'hsl(0 0% 100% / 0.03)',
                    border: '0.5px solid hsl(var(--card-border))',
                  }}
                  aria-label={`${d} - ${data ? data.count + ' tx' : 'no data'}`}
                >
                  <span
                    className={cn(
                      'text-sm sm:text-base md:text-lg font-semibold',
                      isToday ? 'text-primary' : 'text-foreground/90',
                    )}
                  >
                    {d}
                  </span>
                  {data && data.expense > 0 && (
                    <span className="text-[10px] sm:text-xs tabular-nums leading-none text-destructive font-semibold w-full truncate text-right">
                      -{currencySymbol}
                      {data.expense >= 1000
                        ? (data.expense / 1000).toFixed(1) + 'k'
                        : data.expense.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Month summary */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="!p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {t('calendar.income')}
          </p>
          <p className="text-base font-bold text-success tabular-nums">
            {currencySymbol}
            {monthIncome.toFixed(0)}
          </p>
        </GlassCard>
        <GlassCard className="!p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {t('calendar.expenses')}
          </p>
          <p className="text-base font-bold text-destructive tabular-nums">
            {currencySymbol}
            {monthExpense.toFixed(0)}
          </p>
        </GlassCard>
        <GlassCard className="!p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {t('calendar.balance')}
          </p>
          <p
            className={cn(
              'text-base font-bold tabular-nums',
              monthBalance >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {currencySymbol}
            {monthBalance.toFixed(0)}
          </p>
        </GlassCard>
      </motion.div>

      {/* Forecast (current month only) */}
      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard className="border-primary/20" style={{ background: 'hsl(var(--primary) / 0.04)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{t('calendar.forecastTitle')}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('calendar.forecastDesc').replace('{days}', String(forecast.remaining))}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {t('calendar.dailyAvg')}
                    </p>
                    <p className="font-semibold tabular-nums flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      {currencySymbol}
                      {forecast.avgDailyExpense.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {t('calendar.projectedExp')}
                    </p>
                    <p className="font-semibold tabular-nums text-destructive">
                      {currencySymbol}
                      {forecast.projectedExpense.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {t('calendar.projectedBal')}
                    </p>
                    <p
                      className={cn(
                        'font-semibold tabular-nums flex items-center gap-1',
                        forecast.projectedBalance >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {forecast.projectedBalance >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {currencySymbol}
                      {forecast.projectedBalance.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  {selectedDay.toLocaleDateString(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedDay(null)}
                  className="h-7"
                >
                  {t('calendar.close')}
                </Button>
              </div>
              {selectedDayTx.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('calendar.noTx')}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTx.map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <span className="text-sm truncate">{tx.description}</span>
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums shrink-0',
                          tx.type === 'income' ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {currencySymbol}
                        {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
