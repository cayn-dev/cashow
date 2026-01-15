import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: (delay: number) => ({
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      delay: delay * 0.1,
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  }),
};

const hoverVariants = {
  rest: { 
    scale: 1,
    boxShadow: '0 4px 20px -5px hsl(var(--primary) / 0.15)',
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 8px 30px -5px hsl(var(--primary) / 0.25)',
  },
  tap: {
    scale: 0.98,
  },
};

export function AnimatedCard({ 
  children, 
  className,
  delay = 0,
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn('glass-panel rounded-2xl p-4 sm:p-6', className)}
      variants={cardVariants}
      custom={delay}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStatCard({ 
  children, 
  className,
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn('glass-panel rounded-2xl p-4 sm:p-6', className)}
      variants={cardVariants}
      custom={delay}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px -5px hsl(var(--primary) / 0.25)' }}
    >
      {children}
    </motion.div>
  );
}
