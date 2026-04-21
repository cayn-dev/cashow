import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties } from 'react';
import { useTilt } from '@/hooks/useTilt';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  elevated?: boolean;
  style?: CSSProperties;
  /** Enable Apple Vision Pro-style tilt + cursor specular (default true) */
  tilt?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true, 
  glow = false, 
  elevated = false,
  style,
  tilt = true,
}: GlassCardProps) {
  const ref = useTilt<HTMLDivElement>({ enabled: tilt && hover, max: 6 });

  return (
    <div
      ref={ref}
      className={cn(
        elevated ? 'glass-panel-elevated' : 'glass-panel',
        'p-5',
        hover && 'transition-shadow duration-300',
        glow && 'glow',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
