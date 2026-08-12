import { motion, LayoutGroup } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { useFeedback } from '@/hooks/useFeedback';

export interface GlassPillTabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface GlassPillTabsProps<T extends string = string> {
  items: GlassPillTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  /** Optional tone for the active pill, defaults to a solid dark pill (iOS 26) */
  activeTone?: (value: T) => string;
}

/**
 * iOS 26 "Liquid Glass" segmented control:
 * floating glass capsule, active item is a solid pill that slides between
 * positions with a spring layout animation.
 */
export function GlassPillTabs<T extends string = string>({
  items,
  value,
  onChange,
  className,
  size = 'md',
  activeTone,
}: GlassPillTabsProps<T>) {
  const groupId = useId();
  const feedback = useFeedback();

  return (
    <LayoutGroup id={groupId}>
      <div
        role="tablist"
        className={cn(
          'glass-capsule inline-flex items-center gap-1 p-1 max-w-full overflow-x-auto no-scrollbar',
          className
        )}
      >
        {items.map((item) => {
          const active = item.value === value;
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                feedback.tap();
                onChange(item.value);
              }}
              className={cn(
                'press relative z-10 flex items-center justify-center gap-1.5 rounded-full whitespace-nowrap font-semibold transition-colors',
                size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2 text-[13px]',
                active ? 'text-foreground' : 'text-foreground/60 hover:text-foreground/85'
              )}
            >
              {active && (
                <motion.span
                  layoutId="glass-pill-active"
                  aria-hidden
                  className={cn(
                    'absolute inset-0 rounded-full',
                    activeTone ? activeTone(item.value) : 'bg-[hsl(225_25%_5%_/_0.85)]'
                  )}
                  style={{
                    boxShadow:
                      '0 1px 0 0 hsl(0 0% 100% / 0.16) inset, 0 6px 18px hsl(0 0% 0% / 0.45)',
                  }}
                  transition={{ type: 'spring', stiffness: 480, damping: 36, mass: 0.7 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
