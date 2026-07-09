import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Unified liquid-glass empty state used across every dashboard view.
 */
export function GlassEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: GlassEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-14 px-6',
        className
      )}
    >
      {Icon && (
        <div className="glass-empty-icon mb-4">
          <Icon className="w-7 h-7 text-primary/80" strokeWidth={1.5} />
        </div>
      )}
      {title && (
        <h3 className="font-display font-semibold text-lg text-foreground/90 tracking-tight">
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
