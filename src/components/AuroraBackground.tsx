import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  intensity?: 'subtle' | 'medium' | 'vivid';
  className?: string;
}

/**
 * Pure Black OLED background with subtle film grain.
 * No animated blobs — keeps the monochrome aesthetic clean.
 */
export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('fixed inset-0 -z-10 overflow-hidden pointer-events-none', className)}
    >
      {/* Subtle vignette so edges feel deeper */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(0_0%_0%/0.6)_100%)]" />
      {/* Tiny grain texture to break OLED banding */}
      <div className="absolute inset-0 aurora-grain mix-blend-overlay opacity-[0.025]" />
    </div>
  );
}
