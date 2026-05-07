import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties, MouseEventHandler } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  elevated?: boolean;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  elevated = false,
  style,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
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
