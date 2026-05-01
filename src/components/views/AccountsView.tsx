import { useState } from 'react';
import { useBankAccounts, BankAccount } from '@/hooks/useBankAccounts';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, Trash2, Building2, Wallet, CreditCard, PiggyBank, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseBankCSV, hashFile } from '@/lib/csvImporter';

interface AccountsViewProps {
  currencySymbol?: string;
}

const ACCOUNT_TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  checking: { label: 'Conto corrente', icon: Building2, color: '#3B82F6' },
  savings:  { label: 'Risparmio',      icon: PiggyBank, color: '#10B981' },
  credit:   { label: 'Carta credito',  icon: CreditCard, color: '#F43F5E' },
  cash:     { label: 'Contanti',       icon: Wallet, color: '#A78BFA' },
  investment: { label: 'Investimenti', icon: TrendingUp, color: '#F59E0B' },
};

const db = supabase as any;

export function AccountsView({ currencySymbol = '€' }: AccountsViewProps) {
  const { user } = useAuth();
  const { accounts, addAccount, deleteAccount, refetch } = useBankAccounts();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<string>('');

  const [form, setForm] = useState({
    name: '', type: 'checking', bank_name: '', initial_balance: '0',
  });

  const handleAdd = async () => {
    if (!form.name) { toast.error('Inserisci un nome'); return; }
    const meta = ACCOUNT_TYPE_META[form.type];
    await addAccount({
      name: form.name,
      type: form.type as any,
      bank_name: form.bank_name || null,
      icon: '🏦',
      color: meta.color,
      initial_balance: parseFloat(form.initial_balance) || 0,
      currency: 'EUR',
      is_active: true,
    });
    setForm({ name: '', type: 'checking', bank_name: '', initial_balance: '0' });
    setAddOpen(false);
  };

  const handleImport = async (file: File) => {
    if (!user || !importTarget) { toast.error('Seleziona un conto prima di importare'); return; }
    const text = await file.text();
    const fileHash = await hashFile(text);

    // Dedup
    const { data: existing } = await db.from('csv_imports').select('id').eq('user_id', user.id).eq('hash', fileHash).maybeSingle();
    if (existing) { toast.error('Questo file è già stato importato'); return; }

    const { rows, errors } = parseBankCSV(text);
    if (rows.length === 0) {
      toast.error('Nessuna transazione valida trovata: ' + errors.join('; '));
      return;
    }

    let imported = 0;
    for (const r of rows) {
      const { error } = await db.from('transactions').insert({
        user_id: user.id,
        bank_account_id: importTarget,
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description,
        date: r.date.toISOString(),
        payment_method: r.paymentMethod,
        is_salary: r.category === 'salary',
      });
      if (!error) imported++;
    }

    await db.from('csv_imports').insert({
      user_id: user.id,
      bank_account_id: importTarget,
      filename: file.name,
      rows_imported: imported,
      rows_skipped: rows.length - imported,
      hash: fileHash,
    });

    toast.success(`Importate ${imported} transazioni`);
    setImportOpen(false);
    refetch();
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Conti</h1>
          <p className="text-muted-foreground">Gestisci conti bancari, carte e portafogli</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Upload className="w-4 h-4 mr-2" /> Importa CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel-elevated border-0">
              <DialogHeader><DialogTitle>Importa estratto conto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Conto di destinazione</Label>
                  <Select value={importTarget} onValueChange={setImportTarget}>
                    <SelectTrigger><SelectValue placeholder="Scegli conto" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>File CSV</Label>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supporta i principali formati italiani: Intesa, Unicredit, Revolut, BPER, Fineco, etc.
                    Rilevamento automatico di colonne, valute e date.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Plus className="w-4 h-4 mr-2" /> Nuovo conto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel-elevated border-0">
              <DialogHeader><DialogTitle>Nuovo conto</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Es. Conto principale" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_META).map(([k, m]) => (
                        <SelectItem key={k} value={k}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Banca / Provider</Label>
                  <Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Es. Intesa Sanpaolo" />
                </div>
                <div>
                  <Label>Saldo iniziale</Label>
                  <Input type="number" step="0.01" value={form.initial_balance} onChange={e => setForm({ ...form, initial_balance: e.target.value })} />
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Crea</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Patrimonio totale</p>
        <p className="font-display text-4xl font-bold mt-1">{currencySymbol}{totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        <p className="text-xs text-muted-foreground mt-1">su {accounts.length} {accounts.length === 1 ? 'conto' : 'conti'}</p>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(a => {
          const meta = ACCOUNT_TYPE_META[a.type] || ACCOUNT_TYPE_META.checking;
          const Icon = meta.icon;
          return (
            <GlassCard key={a.id} className="p-5 group relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.color + '22', color: a.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <button onClick={() => deleteAccount(a.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="font-semibold">{a.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{a.bank_name || meta.label}</p>
              <p className="font-display text-2xl font-bold">{currencySymbol}{a.current_balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
            </GlassCard>
          );
        })}
        {accounts.length === 0 && (
          <GlassCard className="p-8 col-span-full text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nessun conto. Aggiungi il primo per iniziare a tracciare il patrimonio.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
