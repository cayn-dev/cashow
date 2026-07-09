import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

/**
 * Liquid-glass skeleton primitive.
 * Uses .glass-skeleton (see index.css) for shimmer + iridescent tint.
 */
export function GlassSkeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass-skeleton', className)} {...props} />;
}
