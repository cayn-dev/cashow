import { GlassSkeleton } from '@/components/ui/glass-skeleton';
import { GlassCard } from '@/components/GlassCard';

/**
 * Full-page liquid-glass skeleton for the dashboard while data hydrates.
 * Mirrors the DashboardView layout: hero, stat grid, chart + recent list.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="noir-card p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0 space-y-3 flex-1">
            <GlassSkeleton className="h-3 w-32 rounded-full" />
            <GlassSkeleton className="h-12 sm:h-16 w-3/4 rounded-2xl" />
            <GlassSkeleton className="h-4 w-1/2 rounded-full" />
            <GlassSkeleton className="h-[2px] w-24 rounded-full mt-4" />
          </div>
          <div className="shrink-0 sm:min-w-[260px] space-y-3">
            <GlassSkeleton className="h-3 w-24 rounded-full" />
            <GlassSkeleton className="h-14 w-48 rounded-2xl" />
            <GlassSkeleton className="h-1.5 w-full rounded-full" />
            <GlassSkeleton className="h-11 w-full rounded-full mt-4" />
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} hover={false} className="space-y-3">
            <div className="flex items-center justify-between">
              <GlassSkeleton className="h-3 w-20 rounded-full" />
              <GlassSkeleton className="h-8 w-8 rounded-xl" />
            </div>
            <GlassSkeleton className="h-8 w-28 rounded-lg" />
            <GlassSkeleton className="h-3 w-16 rounded-full" />
          </GlassCard>
        ))}
      </div>

      {/* Chart + recent list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard hover={false} className="xl:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <GlassSkeleton className="h-3 w-20 rounded-full" />
              <GlassSkeleton className="h-6 w-40 rounded-lg" />
            </div>
            <GlassSkeleton className="h-8 w-36 rounded-full" />
          </div>
          <div className="flex items-center gap-6">
            <GlassSkeleton className="h-[200px] w-[200px] rounded-full shrink-0" />
            <div className="flex-1 space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <GlassSkeleton className="h-2.5 w-2.5 rounded-full" />
                  <GlassSkeleton className="h-3 flex-1 rounded-full" />
                  <GlassSkeleton className="h-3 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="space-y-4">
          <div className="flex items-center justify-between">
            <GlassSkeleton className="h-6 w-32 rounded-lg" />
            <GlassSkeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <GlassSkeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <GlassSkeleton className="h-3 w-3/4 rounded-full" />
                  <GlassSkeleton className="h-2.5 w-1/2 rounded-full" />
                </div>
                <GlassSkeleton className="h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
