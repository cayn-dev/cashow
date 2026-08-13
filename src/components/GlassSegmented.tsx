import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFeedback } from '@/hooks/useFeedback';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface GlassSegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** unique id required for the sliding pill layout animation */
  layoutId: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Liquid Glass segmented control (period pickers, secondary tabs).
 * Same visual language as the floating tab bar: glass capsule shell,
 * solid dark pill that morphs between options with a spring.
 */
export function GlassSegmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
  size = 'md',
}: GlassSegmentedProps<T>) {
  const feedback = useFeedback();

  return (
    <div className={cn('liquid-bar p-1 gap-0.5 w-full', className)} role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              feedback.tap();
              onChange(opt.value);
            }}
            className={cn(
              'relative flex-1 rounded-full tap-shrink font-medium',
              size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]',
              active ? 'text-foreground' : 'text-foreground/70'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full liquid-pill-active"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
