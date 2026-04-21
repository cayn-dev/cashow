import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  /** Visual intensity preset */
  intensity?: 'subtle' | 'medium' | 'vivid';
  className?: string;
}

/**
 * Apple visionOS-style animated aurora: 5 colored blobs slowly drifting,
 * scaling and rotating behind the glass surfaces. Pure CSS, GPU-accelerated.
 * Disabled automatically for `prefers-reduced-motion`.
 */
export function AuroraBackground({ intensity = 'medium', className }: AuroraBackgroundProps) {
  const opacityMap = {
    subtle: 'opacity-40',
    medium: 'opacity-60',
    vivid: 'opacity-80',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden pointer-events-none',
        opacityMap[intensity],
        className,
      )}
    >
      {/* Deep base gradient for cohesion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      {/* Aurora blobs */}
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
      <div className="aurora-blob aurora-blob-5" />

      {/* Subtle film grain to break up gradient banding */}
      <div className="absolute inset-0 aurora-grain mix-blend-overlay opacity-[0.04]" />
    </div>
  );
}
