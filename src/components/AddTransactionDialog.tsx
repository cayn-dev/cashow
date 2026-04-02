import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, TrendingUp, TrendingDown, CalendarIcon, Sparkles } from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  CategoryType, 
  PaymentMethod, 
  RecurrenceType,
  CATEGORY_CONFIG,
  PAYMENT_METHODS,
  RECURRENCE_CONFIG,
  autoCategorizeTransaction,
} from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it, enUS, es, fr, de } from 'date-fns/locale';
import { useFeedback } from '@/hooks/useFeedback';
import { useLanguage } from '@/hooks/useLanguage';
import { useSettings } from '@/hooks/useSettings';

const DATE_LOCALES: Record<string, Locale> = { it, en: enUS, es, fr, de };

interface AddTransactionDialogProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export function AddTransactionDialog({ onAdd }: AddTransactionDialogProps) {
  const { t, language } = useLanguage();
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('other');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (settings.defaultPaymentMethod as PaymentMethod) || 'card'
  );
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [customRecurrenceDays, setCustomRecurrenceDays] = useState('');
  const [isSalary, setIsSalary] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [autoSuggested, setAutoSuggested] = useState(false);
  const feedback = useFeedback();

  const dateLocale = DATE_LOCALES[language] || it;

  // Reset payment method from settings when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentMethod((settings.defaultPaymentMethod as PaymentMethod) || 'card');
    }
  }, [open, settings.defaultPaymentMethod]);

  // Auto-categorization effect
  useEffect(() => {
    if (description.length >= 3 && !autoSuggested) {
      const result = autoCategorizeTransaction(description);
      if (result) {
        setCategory(result.category);
        setType(result.type);
        setAutoSuggested(true);
        if (result.category === 'salary') {
          setIsSalary(true);
        }
      }
    }
    if (description.length < 3) {
      setAutoSuggested(false);
    }
  }, [description, autoSuggested]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onAdd({
      type,
      amount: parseFloat(amount),
      category: isSalary ? 'salary' : category,
      description,
      date,
      paymentMethod,
      recurrence,
      customRecurrenceDays: recurrence === 'custom' ? parseInt(customRecurrenceDays) : undefined,
      isSalary,
    });

    feedback.success();

    setAmount('');
    setDescription('');
    setCategory('other');
    setPaymentMethod((settings.defaultPaymentMethod as PaymentMethod) || 'card');
    setRecurrence('none');
    setCustomRecurrenceDays('');
    setIsSalary(false);
    setDate(new Date());
    setAutoSuggested(false);
    setOpen(false);
  };

  const incomeCategories: CategoryType[] = ['salary', 'freelance', 'investments', 'other'];
  const expenseCategories = Object.keys(CATEGORY_CONFIG).filter(
    (key) => !incomeCategories.includes(key as CategoryType) || key === 'other'
  ) as CategoryType[];

  const displayCategories = type === 'income' && !isSalary ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="apple-button text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          {t('addTransaction.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-card-border sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('addTransaction.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => { setType('expense'); setIsSalary(false); }}
              className={cn(
                'flex-1 transition-all duration-500',
                type === 'expense' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_20px_hsl(var(--destructive)/0.3)]'
              )}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              {t('addTransaction.expense')}
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => setType('income')}
              className={cn(
                'flex-1 transition-all duration-500',
                type === 'income' && 'bg-success text-success-foreground hover:bg-success/90 shadow-[0_0_20px_hsl(var(--success)/0.3)]'
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('addTransaction.income')}
            </Button>
          </div>

          {/* Is Salary Toggle (only for income) */}
          {type === 'income' && (
            <div className="flex items-center gap-3 p-3 glass-panel">
              <input
                type="checkbox"
                id="isSalary"
                checked={isSalary}
                onChange={(e) => setIsSalary(e.target.checked)}
                className="w-5 h-5 rounded-lg border-border accent-primary"
              />
              <Label htmlFor="isSalary" className="text-sm cursor-pointer">
                {t('addTransaction.isSalary')}
              </Label>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>{t('addTransaction.date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal glass-input',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: dateLocale }) : t('addTransaction.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-panel" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('addTransaction.amount')} ({settings.currencySymbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input text-lg font-display"
              required
            />
          </div>

          {/* Description with auto-categorization indicator */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              {t('addTransaction.description')}
              {autoSuggested && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="w-3 h-3" />
                  {t('addTransaction.autoCategorized')}
                </span>
              )}
            </Label>
            <Input
              id="description"
              placeholder={t('addTransaction.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {/* Category (hidden if salary) */}
          {!isSalary && (
            <div className="space-y-2">
              <Label>{t('addTransaction.category')}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-card-border max-h-[250px] overflow-y-auto">
                  {displayCategories.map((key) => {
                    const config = CATEGORY_CONFIG[key as CategoryType];
                    if (!config) return null;
                    return (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {t(`cat.${key}`)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t('addTransaction.paymentMethod')}</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-card-border">
                {Object.entries(PAYMENT_METHODS).map(([key]) => (
                  <SelectItem key={key} value={key}>
                    {PAYMENT_METHODS[key as PaymentMethod].emoji} {t(`pay.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>{t('addTransaction.recurrence')}</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger className="glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-card-border">
                {Object.entries(RECURRENCE_CONFIG).map(([key]) => (
                  <SelectItem key={key} value={key}>
                    {t(`rec.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Recurrence Days */}
          {recurrence === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customDays">{t('addTransaction.customDays')}</Label>
              <Input
                id="customDays"
                type="number"
                min="1"
                placeholder={t('addTransaction.customDaysPlaceholder')}
                value={customRecurrenceDays}
                onChange={(e) => setCustomRecurrenceDays(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full apple-button text-primary-foreground">
            {t('addTransaction.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
