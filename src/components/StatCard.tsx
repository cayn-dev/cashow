import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'income' | 'expense' | 'primary';
  delay?: number;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  delay = 0,
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default: 'text-foreground',
    income: 'text-success',
    expense: 'text-destructive',
    primary: 'text-foreground',
  };

  return (
    <GlassCard
      onClick={onClick}
      className={cn(
        'animate-slide-up opacity-0',
        onClick && 'cursor-pointer hover:scale-[1.02] transition-transform',
        delay && `delay-${delay}`
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">{title}</p>
          <p data-sensitive className={cn('text-2xl font-display font-semibold tracking-[-0.02em] tabular-nums sensitive-amount', variantStyles[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'p-2.5 rounded-[12px] ring-1 ring-inset ring-border/50',
          variant === 'income' && 'bg-success/10',
          variant === 'expense' && 'bg-destructive/10',
          variant === 'primary' && 'bg-primary/10',
          variant === 'default' && 'bg-muted'
        )}>
          <Icon className={cn(
            'w-4 h-4',
            variant === 'income' && 'text-success',
            variant === 'expense' && 'text-destructive',
            variant === 'primary' && 'text-primary',
            variant === 'default' && 'text-muted-foreground'
          )} />
        </div>
      </div>
      
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            'text-xs font-medium',
            trend === 'up' && 'text-success',
            trend === 'down' && 'text-destructive',
            trend === 'neutral' && 'text-muted-foreground'
          )}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs mese scorso</span>
        </div>
      )}
    </GlassCard>
  );
}
