import { useState, useEffect, useRef } from 'react';
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
import { Plus, TrendingUp, TrendingDown, CalendarIcon, Sparkles, Camera, Loader2 } from 'lucide-react';
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
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DATE_LOCALES: Record<string, typeof it> = { it, en: enUS, es, fr, de };

/** Downscale + JPEG-compress a picture so the vision model gets a small payload. */
async function fileToCompressedDataUrl(file: File, maxSize = 1400): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode_failed'));
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return dataUrl;
  }
}

interface AddTransactionDialogProps {
  onAdd?: (transaction: Omit<Transaction, 'id'>) => void;
  onEdit?: (id: string, updates: Omit<Transaction, 'id'>) => void;
  transaction?: Transaction;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTransactionDialog({ onAdd, onEdit, transaction, trigger, open: openProp, onOpenChange }: AddTransactionDialogProps) {
  const { t, language } = useLanguage();
  const settings = useSettings();
  const isEdit = !!transaction;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [category, setCategory] = useState<CategoryType>(transaction?.category ?? 'other');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction?.paymentMethod ?? ((settings.defaultPaymentMethod as PaymentMethod) || 'card')
  );
  const [recurrence, setRecurrence] = useState<RecurrenceType>(transaction?.recurrence ?? 'none');
  const [customRecurrenceDays, setCustomRecurrenceDays] = useState(
    transaction?.customRecurrenceDays ? String(transaction.customRecurrenceDays) : ''
  );
  const [isSalary, setIsSalary] = useState(transaction?.isSalary ?? false);
  const [date, setDate] = useState<Date>(transaction?.date ?? new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🏷️');
  const fileRef = useRef<HTMLInputElement>(null);
  const customCats = useCustomCategories();
  const { accounts } = useBankAccounts();
  const [bankAccountId, setBankAccountId] = useState<string>(transaction?.bankAccountId ?? 'none');
  const feedback = useFeedback();

  const dateLocale = DATE_LOCALES[language] || it;

  const handleReceipt = async (file: File) => {
    setScanning(true);
    setScanNote(null);
    try {
      const image = await fileToCompressedDataUrl(file);
      const { data, error } = await supabase.functions.invoke('scan-receipt', { body: { image } });
      if (error) throw error;
      const r = (data as any)?.receipt;
      if (!r) throw new Error('no_data');

      if (typeof r.amount === 'number' && r.amount > 0) setAmount(String(r.amount));
      if (r.description) {
        setDescription(String(r.description));
        setAutoSuggested(true);
      }
      if (r.category && (CATEGORY_CONFIG as Record<string, unknown>)[r.category]) {
        setCategory(r.category as CategoryType);
      }
      if (r.date) {
        const iso = String(r.date);
        const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
        if (!isNaN(parsed.getTime())) setDate(parsed);
      }
      if (r.paymentMethod === 'card' || r.paymentMethod === 'cash' || r.paymentMethod === 'paypal' || r.paymentMethod === 'transfer') {
        setPaymentMethod(r.paymentMethod);
      }
      setType('expense');
      setIsSalary(false);
      const items = Array.isArray(r.items) ? r.items.filter(Boolean).slice(0, 4).join(', ') : '';
      const place = [r.merchant, r.location, items].filter(Boolean).join(' · ');
      setScanNote(place || null);
      feedback.success();
      toast.success(t('receipt.done'));
    } catch (e: any) {
      const status = e?.context?.status;
      if (status === 429) toast.error(t('receipt.rateLimit'));
      else if (status === 402) toast.error(t('receipt.credits'));
      else toast.error(t('receipt.failed'));
    } finally {
      setScanning(false);
    }
  };

  // Reset form when opening (or sync with transaction prop)
  useEffect(() => {
    if (open) {
      if (transaction) {
        setType(transaction.type);
        setAmount(String(transaction.amount));
        setCategory(transaction.category);
        setDescription(transaction.description);
        setPaymentMethod(transaction.paymentMethod);
        setRecurrence(transaction.recurrence);
        setCustomRecurrenceDays(transaction.customRecurrenceDays ? String(transaction.customRecurrenceDays) : '');
        setIsSalary(!!transaction.isSalary);
        setDate(transaction.date);
        setBankAccountId(transaction.bankAccountId ?? 'none');
      } else {
        setPaymentMethod((settings.defaultPaymentMethod as PaymentMethod) || 'card');
      }
    }
  }, [open, transaction, settings.defaultPaymentMethod]);

  // Auto-categorization effect (only when creating)
  useEffect(() => {
    if (isEdit) return;
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
  }, [description, autoSuggested, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const payload: Omit<Transaction, 'id'> = {
      type,
      amount: parseFloat(amount),
      category: isSalary ? 'salary' : category,
      description,
      date,
      paymentMethod,
      recurrence,
      customRecurrenceDays: recurrence === 'custom' ? parseInt(customRecurrenceDays) : undefined,
      isSalary,
      bankAccountId: bankAccountId !== 'none' ? bankAccountId : undefined,
    };

    if (isEdit && transaction && onEdit) {
      onEdit(transaction.id, payload);
    } else if (onAdd) {
      onAdd(payload);
    }

    feedback.success();

    if (!isEdit) {
      setAmount('');
      setDescription('');
      setCategory('other');
      setPaymentMethod((settings.defaultPaymentMethod as PaymentMethod) || 'card');
      setRecurrence('none');
      setCustomRecurrenceDays('');
      setIsSalary(false);
      setBankAccountId('none');
      setDate(new Date());
      setAutoSuggested(false);
    }
    setOpen(false);
  };

  const incomeCategories: CategoryType[] = ['salary', 'freelance', 'investments', 'other'];
  const expenseCategories = Object.keys(CATEGORY_CONFIG).filter(
    (key) => !incomeCategories.includes(key as CategoryType) || key === 'other'
  ) as CategoryType[];

  const displayCategories = type === 'income' && !isSalary ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isEdit ? (
        <DialogTrigger asChild>
          <Button className="apple-button text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            {t('addTransaction.button')}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="dialog-sheet fixed bg-background border-card-border left-0 top-0 translate-x-0 translate-y-0 w-screen max-w-none h-[100dvh] rounded-none border-0 overflow-y-auto p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-[425px] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:p-6">
        {/* Dynamic color wash: green = income, red = expense */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 -z-10 transition-opacity duration-300"
          style={{
            background:
              type === 'income'
                ? 'linear-gradient(180deg, hsl(169 61% 18%) 0%, transparent 100%)'
                : 'linear-gradient(180deg, hsl(351 61% 18%) 0%, transparent 100%)',
          }}
        />
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? t('addTransaction.editTitle') : t('addTransaction.title')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="dialog-stagger space-y-4 mt-4">
          {/* Receipt scanner */}
          {!isEdit && (
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReceipt(f);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={scanning}
                onClick={() => { feedback.tap(); fileRef.current?.click(); }}
                className="w-full glass-input h-11 rounded-xl"
              >
                {scanning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('receipt.scanning')}</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" />{t('receipt.attach')}</>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">{t('receipt.hint')}</p>
              {scanNote && (
                <p className="text-[11px] text-primary text-center">📍 {scanNote}</p>
              )}
            </div>
          )}

          {/* Type Toggle — Liquid Glass capsule with circular buttons */}

          <div className="liquid-bar mx-auto w-fit gap-2 p-1.5">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => { setType('expense'); setIsSalary(false); }}
              className={cn(
                'relative rounded-full px-5 h-11 border-0 tap-shrink transition-all duration-300',
                type === 'expense'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-105 shadow-[0_0_24px_hsl(var(--destructive)/0.5)]'
                  : 'bg-white/5 text-foreground/70 hover:bg-white/10'
              )}
            >
              <TrendingDown className="w-4 h-4 mr-2" strokeWidth={1.8} />
              {t('addTransaction.expense')}
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => setType('income')}
              className={cn(
                'relative rounded-full px-5 h-11 border-0 tap-shrink transition-all duration-300',
                type === 'income'
                  ? 'bg-success text-success-foreground hover:bg-success/90 scale-105 shadow-[0_0_24px_hsl(var(--success)/0.5)]'
                  : 'bg-white/5 text-foreground/70 hover:bg-white/10'
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" strokeWidth={1.8} />
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
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
              <PopoverContent className="w-auto p-0 bg-popover border border-card-border shadow-xl z-[120]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
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
              className={cn(
                'glass-input h-16 text-center text-4xl font-bold tabular tracking-tight',
                type === 'income' ? 'text-success' : 'text-destructive'
              )}
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
                <SelectContent className="bg-popover border-card-border max-h-[250px] overflow-y-auto z-[100]">
                  {displayCategories.map((key) => {
                    const config = CATEGORY_CONFIG[key as CategoryType];
                    if (!config) return null;
                    return (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {t(`cat.${key}`)}
                      </SelectItem>
                    );
                  })}
                  {customCats.categories.map((c) => (
                    <SelectItem key={c.id} value={`custom:${c.id}`}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {newCatOpen ? (
                <div className="flex gap-2">
                  <Input
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value.slice(0, 2))}
                    className="glass-input w-14 text-center"
                    aria-label={t('category.emoji')}
                  />
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={t('category.newName')}
                    className="glass-input flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const name = newCatName.trim();
                      if (!name) return;
                      const created = customCats.addCategory({
                        name,
                        emoji: newCatEmoji || '🏷️',
                        color: 'category-other',
                        keywords: [],
                      });
                      setCategory(`custom:${created.id}` as CategoryType);
                      setNewCatName('');
                      setNewCatEmoji('🏷️');
                      setNewCatOpen(false);
                      feedback.success();
                      toast.success(t('category.created'));
                    }}
                    className="apple-button text-primary-foreground"
                  >
                    {t('category.create')}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewCatOpen(true)}
                  className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('category.new')}
                </Button>
              )}
            </div>

          )}

          {/* Account */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>{t('addTransaction.account')}</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-card-border z-[100]">
                  <SelectItem value="none">{t('addTransaction.noAccount')}</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.icon || '🏦'} {a.name}
                    </SelectItem>
                  ))}
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
              <SelectContent className="bg-popover border-card-border z-[100]">
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
              <SelectContent className="bg-popover border-card-border z-[100]">
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
            {isEdit ? t('addTransaction.update') : t('addTransaction.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
