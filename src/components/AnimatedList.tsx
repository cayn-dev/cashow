import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0,
    x: -100,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}

export function AnimatedListItem({ 
  children, 
  itemKey 
}: { 
  children: ReactNode; 
  itemKey: string;
}) {
  return (
    <motion.div
      key={itemKey}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      layoutId={itemKey}
    >
      {children}
    </motion.div>
  );
}
