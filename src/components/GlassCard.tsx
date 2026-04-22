import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  elevated?: boolean;
  style?: CSSProperties;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  elevated = false,
  style,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        elevated ? 'glass-panel-elevated' : 'glass-panel',
        'p-5',
        hover && 'transition-all duration-300',
        glow && 'glow',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
