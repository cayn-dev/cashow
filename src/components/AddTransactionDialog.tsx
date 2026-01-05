import { useState } from 'react';
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
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  CategoryType, 
  PaymentMethod, 
  RecurrenceType,
  CATEGORY_CONFIG,
  PAYMENT_METHODS 
} from '@/types/finance';
import { cn } from '@/lib/utils';

interface AddTransactionDialogProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export function AddTransactionDialog({ onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('other');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [isSalary, setIsSalary] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onAdd({
      type,
      amount: parseFloat(amount),
      category: isSalary ? 'salary' : category,
      description,
      date: new Date(),
      paymentMethod,
      recurrence,
      isSalary,
    });

    // Reset form
    setAmount('');
    setDescription('');
    setCategory('other');
    setPaymentMethod('card');
    setRecurrence('none');
    setIsSalary(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Transazione
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-card-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Aggiungi Transazione</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => { setType('expense'); setIsSalary(false); }}
              className={cn(
                'flex-1',
                type === 'expense' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Uscita
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => setType('income')}
              className={cn(
                'flex-1',
                type === 'income' && 'bg-success text-success-foreground hover:bg-success/90'
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Entrata
            </Button>
          </div>

          {/* Is Salary Toggle (only for income) */}
          {type === 'income' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isSalary"
                checked={isSalary}
                onChange={(e) => setIsSalary(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="isSalary" className="text-sm">
                💰 Questo è uno stipendio
              </Label>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Importo (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted/50 border-card-border text-lg font-display"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              placeholder="Es: Spesa al supermercato"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/50 border-card-border"
              required
            />
          </div>

          {/* Category (hidden if salary) */}
          {!isSalary && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
                <SelectTrigger className="bg-muted/50 border-card-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-card-border">
                  {Object.entries(CATEGORY_CONFIG)
                    .filter(([key]) => key !== 'salary')
                    .map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {config.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Metodo di Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-muted/50 border-card-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-card-border">
                {Object.entries(PAYMENT_METHODS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.emoji} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Ricorrenza</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger className="bg-muted/50 border-card-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-card-border">
                <SelectItem value="none">Una tantum</SelectItem>
                <SelectItem value="daily">Giornaliera</SelectItem>
                <SelectItem value="weekly">Settimanale</SelectItem>
                <SelectItem value="monthly">Mensile</SelectItem>
                <SelectItem value="yearly">Annuale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Aggiungi
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
