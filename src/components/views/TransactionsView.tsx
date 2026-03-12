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
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t, language } = useLanguage();

  const dateLocale = language === 'it' ? 'it-IT' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : 'en-US';

  const filteredTransactions = transactions.filter((tr) => {
    const matchesSearch = tr.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tr.category === categoryFilter;
    const matchesType = typeFilter === 'all' || tr.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const groupedByDate = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = transaction.date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}>
        <div>
          <h1 className="font-display text-3xl font-bold">{t('transactions.title')}</h1>
          <p className="text-muted-foreground">{t('transactions.subtitle')}</p>
        </div>
        <AddTransactionDialog onAdd={onAddTransaction} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}>
        <GlassCard>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('transactions.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-muted/50 border-card-border" />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-muted/50 border-card-border"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-card-border">
                  <SelectItem value="all">{t('transactions.all')}</SelectItem>
                  <SelectItem value="income">{t('transactions.income')}</SelectItem>
                  <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] bg-muted/50 border-card-border"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-card-border">
                  <SelectItem value="all">{t('transactions.allFem')}</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.emoji} {t(`cat.${key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {Object.entries(groupedByDate).map(([date, dayTransactions], groupIndex) => (
            <motion.div key={date} className="space-y-3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: groupIndex * 0.05, type: 'spring', stiffness: 300, damping: 25 }} layout>
              <motion.h3 className="text-sm font-medium text-muted-foreground capitalize px-1" layout>{date}</motion.h3>
              <motion.div className="space-y-2" layout>
                <AnimatePresence mode="popLayout">
                  {dayTransactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} onDelete={onDeleteTransaction} currencySymbol={currencySymbol} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {filteredTransactions.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
              <GlassCard>
                <div className="text-center py-12">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>
                    <Filter className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  </motion.div>
                  <p className="text-muted-foreground">{t('transactions.noResults')}</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
