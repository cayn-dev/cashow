import { useState } from 'react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
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

const ACCOUNT_TYPE_META: Record<string, { icon: any; color: string; key: string }> = {
  checking:   { icon: Building2,   color: '#3B82F6', key: 'accounts.type.checking' },
  savings:    { icon: PiggyBank,   color: '#10B981', key: 'accounts.type.savings' },
  credit:     { icon: CreditCard,  color: '#F43F5E', key: 'accounts.type.credit' },
  cash:       { icon: Wallet,      color: '#A78BFA', key: 'accounts.type.cash' },
  investment: { icon: TrendingUp,  color: '#F59E0B', key: 'accounts.type.investment' },
};

const db = supabase as any;

export function AccountsView({ currencySymbol = '€' }: AccountsViewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, addAccount, deleteAccount, refetch } = useBankAccounts();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const [form, setForm] = useState({
    name: '', type: 'checking', bank_name: '', initial_balance: '0',
  });

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error(t('accounts.nameRequired')); return; }
    const meta = ACCOUNT_TYPE_META[form.type];
    await addAccount({
      name: form.name.trim(),
      type: form.type as any,
      bank_name: form.bank_name.trim() || null,
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
    if (!user || !importTarget) { toast.error(t('accounts.selectFirst')); return; }
    setImporting(true);
    try {
      const text = await file.text();
      const fileHash = await hashFile(text);

      const { data: existing } = await db.from('csv_imports')
        .select('id').eq('user_id', user.id).eq('hash', fileHash).maybeSingle();
      if (existing) { toast.error(t('accounts.alreadyImported')); return; }

      const { rows, errors } = parseBankCSV(text);
      if (rows.length === 0) {
        toast.error(t('accounts.noValidRows') + (errors.length ? ': ' + errors.join('; ') : ''));
        return;
      }

      const payload = rows.map(r => ({
        user_id: user.id,
        bank_account_id: importTarget,
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description,
        date: r.date.toISOString(),
        payment_method: r.paymentMethod,
        is_salary: r.category === 'salary',
      }));

      const { error: insErr, count } = await db.from('transactions').insert(payload, { count: 'exact' });
      const imported = insErr ? 0 : (count ?? payload.length);

      await db.from('csv_imports').insert({
        user_id: user.id,
        bank_account_id: importTarget,
        filename: file.name,
        rows_imported: imported,
        rows_skipped: rows.length - imported,
        hash: fileHash,
      });

      if (insErr) {
        toast.error(t('accounts.error', { msg: insErr.message }));
      } else {
        toast.success(t('accounts.imported', { n: imported }));
      }
      setImportOpen(false);
      refetch();
    } finally {
      setImporting(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const accLabel = accounts.length === 1 ? t('accounts.accountSing') : t('accounts.accountPlur');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('accounts.title')}</h1>
          <p className="text-muted-foreground">{t('accounts.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full" disabled={accounts.length === 0}>
                <Upload className="w-4 h-4 mr-2" /> {t('accounts.import')}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel-elevated border-0">
              <DialogHeader><DialogTitle>{t('accounts.importTitle')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('accounts.target')}</Label>
                  <Select value={importTarget} onValueChange={setImportTarget}>
                    <SelectTrigger><SelectValue placeholder={t('accounts.chooseAccount')} /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('accounts.csvFile')}</Label>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={importing || !importTarget}
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-2">{t('accounts.importHelp')}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Plus className="w-4 h-4 mr-2" /> {t('accounts.new')}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel-elevated border-0">
              <DialogHeader><DialogTitle>{t('accounts.new')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{t('accounts.name')}</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('accounts.namePlaceholder')} />
                </div>
                <div>
                  <Label>{t('accounts.type')}</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_META).map(([k, m]) => (
                        <SelectItem key={k} value={k}>{t(m.key)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('accounts.bank')}</Label>
                  <Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder={t('accounts.bankPlaceholder')} />
                </div>
                <div>
                  <Label>{t('accounts.initialBalance')}</Label>
                  <Input type="number" step="0.01" value={form.initial_balance} onChange={e => setForm({ ...form, initial_balance: e.target.value })} />
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>{t('accounts.create')}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">{t('accounts.totalWealth')}</p>
        <p className="font-display text-4xl font-bold mt-1" data-sensitive>
          {currencySymbol}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('accounts.onAccounts', { n: accounts.length, label: accLabel })}
        </p>
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
                <button
                  onClick={() => deleteAccount(a.id)}
                  className="opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                  aria-label={t('accounts.deleted')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="font-semibold">{a.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{a.bank_name || t(meta.key)}</p>
              <p className="font-display text-2xl font-bold" data-sensitive>
                {currencySymbol}{a.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </GlassCard>
          );
        })}
        {accounts.length === 0 && (
          <GlassCard className="p-8 col-span-full text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>{t('accounts.empty')}</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
