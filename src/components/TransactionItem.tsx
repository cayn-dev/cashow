import { Transaction, CATEGORY_CONFIG, PAYMENT_METHODS } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useFeedback } from '@/hooks/useFeedback';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit?: (id: string, updates: Omit<Transaction, 'id'>) => void;
  currencySymbol?: string;
}

export function TransactionItem({ transaction, onDelete, onEdit, currencySymbol = '€' }: TransactionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const category = CATEGORY_CONFIG[transaction.category] || { label: transaction.category, emoji: '📦', color: 'category-other' };
  const payment = PAYMENT_METHODS[transaction.paymentMethod] || { label: transaction.paymentMethod, emoji: '💱' };
  const isIncome = transaction.type === 'income';
  const feedback = useFeedback();

  const handleDelete = () => {
    setIsDeleting(true);
    feedback.delete();
    setTimeout(() => {
      onDelete(transaction.id);
    }, 200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        y: 0,
        scale: isDeleting ? 0.8 : 1,
        x: isDeleting ? -100 : 0,
      }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30, opacity: { duration: 0.2 } }}
      whileHover={{ scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.99 }}
      className="group flex items-center justify-between py-2.5 px-3 sm:py-3 sm:px-4 rounded-2xl bg-card/50 border border-card-border hover:bg-card/80 transition-colors duration-200 gap-2 overflow-hidden"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <motion.div
          className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0', isIncome ? 'bg-success/10' : 'bg-muted')}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {category.emoji}
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-foreground truncate">{transaction.description}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{category.label}</span>
            <span>•</span>
            <span className="shrink-0">{format(transaction.date, 'd MMM', { locale: it })}</span>
            {transaction.recurrence !== 'none' && (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw className="w-3 h-3 text-muted-foreground shrink-0" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <motion.span
          className={cn('font-display font-bold text-lg sm:text-2xl whitespace-nowrap tracking-tight', isIncome ? 'text-success' : 'text-destructive')}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {isIncome ? '+' : '-'}{currencySymbol}{transaction.amount.toLocaleString()}
        </motion.span>

        {onEdit && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditOpen(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 shrink-0"
              aria-label="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <AddTransactionDialog
              transaction={transaction}
              onEdit={onEdit}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
