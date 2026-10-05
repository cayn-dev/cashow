import { motion } from 'framer-motion';

const ROWS = [
  { w: '70%', label: 'merchant' },
  { w: '45%', label: 'date' },
  { w: '85%', label: 'item' },
  { w: '60%', label: 'item' },
  { w: '75%', label: 'item' },
  { w: '40%', label: 'total' },
];

/** Animated receipt being "read" line by line while the scan runs. */
export function ReceiptScanAnimation({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 py-3"
    >
      <div className="relative w-40 overflow-hidden rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <div className="space-y-2.5">
          {ROWS.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted">
                <motion.div
                  className="h-2 rounded-full bg-foreground/70"
                  initial={{ width: 0 }}
                  animate={{ width: [0, r.w, r.w, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18, times: [0, 0.35, 0.85, 1] }}
                />
              </div>
              <motion.span
                className="text-[9px] font-mono text-muted-foreground"
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18 + 0.3, times: [0, 0.3, 0.8, 1] }}
              >
                ✓
              </motion.span>
            </div>
          ))}
        </div>
        {/* scanning beam */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-primary/25 to-transparent"
          animate={{ top: ['-20%', '100%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-px bg-primary"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
        {/* zig-zag bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[radial-gradient(circle_at_4px_0,transparent_3px,hsl(var(--background))_3px)] [background-size:8px_6px]" />
      </div>
      <motion.p
        className="text-xs text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
}
