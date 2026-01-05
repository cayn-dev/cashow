import { Transaction, CATEGORY_CONFIG, PAYMENT_METHODS } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const category = CATEGORY_CONFIG[transaction.category];
  const payment = PAYMENT_METHODS[transaction.paymentMethod];
  const isIncome = transaction.type === 'income';

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-card/50 border border-card-border hover:bg-card/80 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
          isIncome ? 'bg-success/10' : 'bg-muted'
        )}>
          {category.emoji}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{transaction.description}</p>
            {transaction.recurrence !== 'none' && (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{category.label}</span>
            <span>•</span>
            <span>{payment.emoji} {payment.label}</span>
            <span>•</span>
            <span>{format(transaction.date, 'd MMM', { locale: it })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={cn(
          'font-display font-semibold text-lg',
          isIncome ? 'text-success' : 'text-destructive'
        )}>
          {isIncome ? '+' : '-'}€{transaction.amount.toLocaleString()}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(transaction.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
