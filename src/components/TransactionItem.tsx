import { Transaction, CATEGORY_CONFIG, PAYMENT_METHODS } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  currencySymbol?: string;
}

export function TransactionItem({ transaction, onDelete, currencySymbol = '€' }: TransactionItemProps) {
  const category = CATEGORY_CONFIG[transaction.category];
  const payment = PAYMENT_METHODS[transaction.paymentMethod];
  const isIncome = transaction.type === 'income';

  return (
    <div className="group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-card/50 border border-card-border hover:bg-card/80 transition-all duration-200 gap-2 overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <div className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0',
          isIncome ? 'bg-success/10' : 'bg-muted'
        )}>
          {category.emoji}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{transaction.description}</p>
            {transaction.recurrence !== 'none' && (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <span className="truncate">{category.label}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1">{payment.emoji} {payment.label}</span>
            <span>•</span>
            <span className="shrink-0">{format(transaction.date, 'd MMM', { locale: it })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className={cn(
          'font-display font-semibold text-sm sm:text-lg whitespace-nowrap',
          isIncome ? 'text-success' : 'text-destructive'
        )}>
          {isIncome ? '+' : '-'}{currencySymbol}{transaction.amount.toLocaleString()}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(transaction.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
