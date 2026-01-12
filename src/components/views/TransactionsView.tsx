import { useState } from 'react';
import { Transaction, CATEGORY_CONFIG, CategoryType } from '@/types/finance';
import { TransactionItem } from '@/components/TransactionItem';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  currencySymbol?: string;
}

export function TransactionsView({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currencySymbol = '€',
}: TransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const groupedByDate = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = transaction.date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Movimenti</h1>
          <p className="text-muted-foreground">
            Tutte le tue transazioni
          </p>
        </div>
        <AddTransactionDialog onAdd={onAddTransaction} />
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca transazioni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-card-border"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50 border-card-border">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-card-border">
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="income">Entrate</SelectItem>
                <SelectItem value="expense">Uscite</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-muted/50 border-card-border">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-card-border">
                <SelectItem value="all">Tutte</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.emoji} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Transactions List */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground capitalize px-1">
              {date}
            </h3>
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={onDeleteTransaction}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <GlassCard>
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nessuna transazione trovata</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
