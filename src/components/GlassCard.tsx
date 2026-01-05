import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}

export function GlassCard({ children, className, hover = true, glow = false, style }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-panel p-5',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-hover',
        glow && 'shadow-glow',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
