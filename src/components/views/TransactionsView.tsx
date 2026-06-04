import { useMemo, useState } from 'react';
import { Transaction, CATEGORY_CONFIG, PAYMENT_METHODS } from '@/types/finance';
import { TransactionItem } from '@/components/TransactionItem';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter, Download, FileText, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import { exportTransactionsCsv, exportMonthlyReportPdf } from '@/lib/exporters';
import { toast } from 'sonner';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, updates: Omit<Transaction, 'id'>) => void;
  currencySymbol?: string;
}

export function TransactionsView({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  currencySymbol = '€',
}: TransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const { t, language } = useLanguage();

  const dateLocale =
    language === 'it' ? 'it-IT'
    : language === 'es' ? 'es-ES'
    : language === 'fr' ? 'fr-FR'
    : language === 'de' ? 'de-DE'
    : 'en-US';

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const min = amountMin ? parseFloat(amountMin) : null;
    const max = amountMax ? parseFloat(amountMax) : null;
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;

    return transactions.filter(tx => {
      if (term && !tx.description.toLowerCase().includes(term)) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;
      if (min !== null && !Number.isNaN(min) && tx.amount < min) return false;
      if (max !== null && !Number.isNaN(max) && tx.amount > max) return false;
      if (from && tx.date < from) return false;
      if (to && tx.date > to) return false;
      return true;
    });
  }, [transactions, searchTerm, categoryFilter, typeFilter, paymentFilter, dateFrom, dateTo, amountMin, amountMax]);

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

  const advancedActive =
    paymentFilter !== 'all' ||
    !!dateFrom || !!dateTo ||
    !!amountMin || !!amountMax;

  const clearAdvanced = () => {
    setPaymentFilter('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  };

  const handleCsv = () => {
    if (filteredTransactions.length === 0) {
      toast.error(t('transactions.exportEmpty'));
      return;
    }
    exportTransactionsCsv(filteredTransactions, currencySymbol);
    toast.success(t('transactions.exportCsvOk'));
  };

  const handlePdf = () => {
    if (filteredTransactions.length === 0) {
      toast.error(t('transactions.exportEmpty'));
      return;
    }
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    exportMonthlyReportPdf(filteredTransactions, {
      currencySymbol,
      title: 'Cashow — Report',
      income,
      expenses,
      balance: income - expenses,
    });
    toast.success(t('transactions.exportPdfOk'));
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <motion.div className="flex items-center justify-between gap-3 flex-wrap" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div>
          <h1 className="font-display text-3xl font-bold">{t('transactions.title')}</h1>
          <p className="text-muted-foreground">{t('transactions.subtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="icon" onClick={handleCsv} title={t('transactions.exportCsv')}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handlePdf} title={t('transactions.exportPdf')}>
            <FileText className="w-4 h-4" />
          </Button>
          <AddTransactionDialog onAdd={onAddTransaction} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <GlassCard>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('transactions.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/50 border-card-border"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px] bg-muted/50 border-card-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel border-card-border">
                    <SelectItem value="all">{t('transactions.all')}</SelectItem>
                    <SelectItem value="income">{t('transactions.income')}</SelectItem>
                    <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px] bg-muted/50 border-card-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel border-card-border max-h-[300px]">
                    <SelectItem value="all">{t('transactions.allFem')}</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.emoji} {t(`cat.${key}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={advancedActive ? 'default' : 'outline'} size="icon" className="shrink-0">
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-popover border border-card-border shadow-xl w-[300px] p-4 z-[120]" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{t('transactions.advanced')}</h4>
                        {advancedActive && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={clearAdvanced}>
                            <X className="w-3 h-3 mr-1" /> {t('transactions.clear')}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">{t('transactions.payment')}</label>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                          <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                          <SelectContent className="glass-panel">
                            <SelectItem value="all">{t('transactions.all')}</SelectItem>
                            {Object.entries(PAYMENT_METHODS).map(([key, m]) => (
                              <SelectItem key={key} value={key}>{m.emoji} {m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">{t('transactions.dateFrom')}</label>
                          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">{t('transactions.dateTo')}</label>
                          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-muted/50" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">{t('transactions.amountMin')}</label>
                          <Input type="number" inputMode="decimal" placeholder="0" value={amountMin} onChange={e => setAmountMin(e.target.value)} className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">{t('transactions.amountMax')}</label>
                          <Input type="number" inputMode="decimal" placeholder="∞" value={amountMax} onChange={e => setAmountMax(e.target.value)} className="bg-muted/50" />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('transactions.showing').replace('{n}', String(filteredTransactions.length))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {Object.entries(groupedByDate).map(([date, dayTransactions], groupIndex) => (
            <motion.div key={date} className="space-y-3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: groupIndex * 0.04 }} layout>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <GlassCard>
                <div className="text-center py-12">
                  <Filter className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
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
