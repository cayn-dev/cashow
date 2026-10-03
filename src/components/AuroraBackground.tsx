import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  intensity?: 'subtle' | 'medium' | 'vivid';
  className?: string;
}

/**
 * Ambient background: vignette + slowly drifting accent orbs + film grain.
 * Fixed behind content (pointer-events-none, -z-10) so it can never intersect UI.
 */
export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('fixed inset-0 -z-10 overflow-hidden pointer-events-none', className)}
    >
      {/* Tiny grain texture to break OLED banding */}
      <div className="absolute inset-0 aurora-grain mix-blend-overlay opacity-[0.025]" />
    </div>
  );
}
