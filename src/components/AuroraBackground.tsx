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
      {/* Drifting accent orbs — color follows --primary so they match the theme */}
      <div className="aurora-orb aurora-orb--a" />
      <div className="aurora-orb aurora-orb--b" />
      <div className="aurora-orb aurora-orb--c" />

      {/* Purple smoke plumes drifting behind everything */}
      <div className="smoke-veil" />
      <div className="smoke-veil smoke-veil--slow" />

      {/* Vignette so edges feel deeper */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(0_0%_0%/0.55)_100%)]" />

      {/* Tiny grain texture to break OLED banding */}
      <div className="absolute inset-0 aurora-grain mix-blend-overlay opacity-[0.025]" />
    </div>
  );
}
