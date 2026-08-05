import { motion } from 'framer-motion';
import { AlertTriangle, Gauge } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';

interface MonthlyLimitCardProps {
  spent: number;
  limit: number;
  currencySymbol?: string;
}

export function MonthlyLimitCard({ spent, limit, currencySymbol = '€' }: MonthlyLimitCardProps) {
  const { t } = useLanguage();
  if (!limit || limit <= 0) return null;

  const pct = (spent / limit) * 100;
  const remaining = limit - spent;
  const over = pct > 100;

  const barClass = over
    ? 'bg-destructive'
    : pct >= 70
      ? 'bg-warning'
      : 'bg-success';

  const fmt = (n: number) =>
    `${currencySymbol}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="font-display italic text-xl flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          {t('budget.overallLimit')}
        </h3>
        {over && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t('budget.overBudget')}
          </Badge>
        )}
      </div>

      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm flex-wrap">
        <span className="text-muted-foreground tabular-nums">
          {t('budget.spentOf').replace('{spent}', fmt(spent)).replace('{limit}', fmt(limit))}
        </span>
        <span className={`tabular-nums font-medium ${over ? 'text-destructive' : 'text-foreground/80'}`}>
          {over
            ? `+${fmt(remaining)}`
            : t('budget.remaining').replace('{amount}', fmt(remaining))}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">{pct.toFixed(0)}%</p>
    </GlassCard>
  );
}
