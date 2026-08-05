import { useEffect, useState } from 'react';
import { Transaction } from '@/types/finance';
import { GlassCard } from '@/components/GlassCard';
import { GlassEmptyState } from '@/components/ui/glass-empty-state';
import { StatCard } from '@/components/StatCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wallet, TrendingUp, Calculator, LineChart, Info } from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, XAxis, YAxis, Tooltip as RTooltip } from 'recharts';
import { format } from 'date-fns';
import { it, enUS, es, fr, de } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { useSettings } from '@/hooks/useSettings';
import {
  SalaryFrequency,
  grossToNet,
  netMonthlySalary,
  toMonthly,
} from '@/lib/salary';

const dateFnsLocales: Record<string, typeof it> = { it, en: enUS, es, fr, de };

interface SalaryViewProps {
  monthlySalary: number;
  cumulativeSalary: number;
  salaryTransactions: Transaction[];
  onSetMonthlySalary: (
    salary: number,
    meta?: { frequency?: SalaryFrequency; isGross?: boolean },
  ) => void;
  currencySymbol?: string;
}

const FREQUENCIES: SalaryFrequency[] = ['weekly', 'monthly', 'yearly'];

export function SalaryView({
  monthlySalary,
  cumulativeSalary,
  salaryTransactions,
  onSetMonthlySalary,
  currencySymbol = '€',
}: SalaryViewProps) {
  const { t, language } = useLanguage();
  const settings = useSettings();
  const locale = dateFnsLocales[language] || it;

  const [amount, setAmount] = useState(
    settings.salaryAmount ? String(settings.salaryAmount) : monthlySalary.toString(),
  );
  const [frequency, setFrequency] = useState<SalaryFrequency>(settings.salaryFrequency);
  const [isGross, setIsGross] = useState(settings.salaryIsGross);
  const [pendingFrequency, setPendingFrequency] = useState<SalaryFrequency | null>(null);

  // Keep the form in sync when the stored configuration is (re)hydrated
  useEffect(() => {
    setFrequency(settings.salaryFrequency);
    setIsGross(settings.salaryIsGross);
    if (settings.salaryAmount > 0) setAmount(String(settings.salaryAmount));
  }, [settings.salaryFrequency, settings.salaryIsGross, settings.salaryAmount]);

  const numericAmount = parseFloat(amount) || 0;
  const showNetGross = frequency !== 'weekly';
  const effectiveGross = showNetGross && isGross;
  const netEstimate = effectiveGross ? grossToNet(numericAmount, frequency) : numericAmount;
  const netMonthly = netMonthlySalary(numericAmount, frequency, effectiveGross);

  const freqLabel = (f: SalaryFrequency) => t(`salary.freq.${f}`);
  const salaryBoxLabel = t(`salary.label.${frequency}`);

  const applyFrequency = (next: SalaryFrequency) => {
    setFrequency(next);
    if (next === 'weekly') setIsGross(false);
    settings.setSalaryConfig({ frequency: next, isGross: next === 'weekly' ? false : isGross });
  };

  const handleFrequencyChange = (value: string) => {
    if (!value) return;
    const next = value as SalaryFrequency;
    if (next === frequency) return;
    if (numericAmount > 0) {
      setPendingFrequency(next);
    } else {
      applyFrequency(next);
    }
  };

  const handleGrossToggle = (checked: boolean) => {
    setIsGross(checked);
    settings.setSalaryConfig({ isGross: checked });
  };

  const handleUpdateSalary = () => {
    if (isNaN(numericAmount) || numericAmount < 0) return;
    settings.setSalaryConfig({ amount: numericAmount, frequency, isGross: effectiveGross });
    onSetMonthlySalary(numericAmount, { frequency, isGross: effectiveGross });
  };

  const sortedSalaries = [...salaryTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  let runningTotal = 0;
  const chartData = sortedSalaries.map((tr) => {
    runningTotal += tr.amount;
    return { date: format(tr.date, 'MMM yy', { locale }), amount: tr.amount, cumulative: runningTotal };
  });

  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('salary.title')}</h1>
        <p className="text-muted-foreground">{t('salary.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={salaryBoxLabel}
          value={fmt(numericAmount || toMonthly(monthlySalary, 'monthly'))}
          subtitle={`${t('salary.netMonthlyBase')}: ${fmt(netMonthly || monthlySalary)}`}
          icon={Wallet}
          variant="primary"
          delay={0}
        />
        <StatCard
          title={t('salary.cumulative')}
          value={fmt(cumulativeSalary)}
          subtitle={t('salary.totalEarned')}
          icon={TrendingUp}
          variant="income"
          delay={100}
        />
        <StatCard
          title={t('salary.monthlyAverage')}
          value={fmt(salaryTransactions.length > 0 ? cumulativeSalary / salaryTransactions.length : 0)}
          icon={Calculator}
          delay={200}
        />
      </div>

      <GlassCard>
        <h3 className="font-display font-semibold text-lg mb-4">{t('salary.updateTitle')}</h3>

        {/* Frequency selector */}
        <div className="space-y-2 mb-4">
          <Label>{t('salary.frequency')}</Label>
          <ToggleGroup
            type="single"
            value={frequency}
            onValueChange={handleFrequencyChange}
            className="justify-start gap-2 flex-wrap"
          >
            {FREQUENCIES.map((f) => (
              <ToggleGroupItem
                key={f}
                value={f}
                aria-label={freqLabel(f)}
                className="px-4 rounded-xl border border-card-border data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              >
                {freqLabel(f)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Net / Gross switch — only for monthly & yearly */}
        {showNetGross && (
          <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className={!isGross ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                {t('salary.net')}
              </span>
              <Switch checked={isGross} onCheckedChange={handleGrossToggle} aria-label={t('salary.netGross')} />
              <span className={isGross ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                {t('salary.gross')}
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={t('salary.taxInfo')} className="text-muted-foreground hover:text-foreground">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">{t('salary.taxInfo')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="newSalary">
              {t('salary.newAmount')} ({currencySymbol}/{freqLabel(frequency).toLowerCase()})
            </Label>
            <Input
              id="newSalary"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted/50 border-card-border text-lg font-display"
              placeholder="0.00"
            />
          </div>
          <Button onClick={handleUpdateSalary} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {t('salary.update')}
          </Button>
        </div>

        {/* Gross → net estimate */}
        {effectiveGross && numericAmount > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm">
              {t('salary.estimatedNet')}:{' '}
              <span className="font-semibold text-primary tabular-nums">
                {fmt(netEstimate)} / {freqLabel(frequency).toLowerCase()}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('salary.taxInfo')}</p>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {t('salary.netMonthlyBase')}:{' '}
          <span className="tabular-nums text-foreground/80">{fmt(netMonthly)}</span>
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <LineChart className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">{t('salary.chartTitle')}</h3>
        </div>
        {chartData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                />
                <RTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-3">
                          <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
                          <p className="text-sm font-medium">
                            {t('salary.chartSalary')}:{' '}
                            <span className="text-success">{fmt(payload[0].payload.amount)}</span>
                          </p>
                          <p className="text-sm font-medium">
                            {t('salary.chartTotal')}:{' '}
                            <span className="text-primary">{fmt(payload[0].payload.cumulative)}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <GlassEmptyState icon={Wallet} title={t('salary.noSalary')} description={t('salary.addSalary')} />
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="font-display font-semibold text-lg mb-4">{t('salary.history')}</h3>
        <div className="space-y-3">
          {salaryTransactions.slice(0, 6).map((tr) => (
            <div key={tr.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-medium">{tr.description}</p>
                  <p className="text-sm text-muted-foreground">{format(tr.date, 'd MMMM yyyy', { locale })}</p>
                </div>
              </div>
              <span className="font-display font-semibold text-lg text-success">+{fmt(tr.amount)}</span>
            </div>
          ))}
          {salaryTransactions.length === 0 && (
            <GlassEmptyState icon={Wallet} title={t('salary.noSalary')} compact />
          )}
        </div>
      </GlassCard>

      {/* Frequency change confirmation */}
      <AlertDialog open={!!pendingFrequency} onOpenChange={(o) => !o && setPendingFrequency(null)}>
        <AlertDialogContent className="glass-panel-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('salary.changeFreqTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('salary.changeFreqDesc')
                .replace('{from}', freqLabel(frequency))
                .replace('{to}', pendingFrequency ? freqLabel(pendingFrequency) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingFrequency) applyFrequency(pendingFrequency);
                setPendingFrequency(null);
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
