import { useState } from 'react';
import { useSharedGroups, useGroupDetails, SharedGroup } from '@/hooks/useSharedGroups';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, ArrowLeft, UserPlus, Receipt, Trash2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface GroupsViewProps {
  currencySymbol?: string;
}

export function GroupsView({ currencySymbol = '€' }: GroupsViewProps) {
  const { groups, createGroup, deleteGroup } = useSharedGroups();
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', emoji: '👥', type: 'group' });

  const handleCreate = async () => {
    if (!form.name) { toast.error('Nome obbligatorio'); return; }
    const g = await createGroup({ ...form, currency: 'EUR' } as any);
    setForm({ name: '', description: '', emoji: '👥', type: 'group' });
    setCreateOpen(false);
    if (g) setOpenId(g.id);
  };

  if (openId) {
    const g = groups.find(g => g.id === openId);
    if (g) return <GroupDetail group={g} currencySymbol={currencySymbol} onBack={() => setOpenId(null)} onDelete={async () => { await deleteGroup(g.id); setOpenId(null); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Conti condivisi</h1>
          <p className="text-muted-foreground">Coinquilini, coppie, viaggi — dividi le spese</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Plus className="w-4 h-4 mr-2" /> Nuovo gruppo
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-elevated border-0">
            <DialogHeader><DialogTitle>Nuovo gruppo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input className="w-20 text-center text-2xl" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value.slice(0, 2) })} />
                <Input className="flex-1" placeholder="Nome (es. Casa via Roma)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Gruppo generico</SelectItem>
                    <SelectItem value="couple">Coppia</SelectItem>
                    <SelectItem value="roommates">Coinquilini</SelectItem>
                    <SelectItem value="trip">Viaggio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Descrizione (opzionale)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter><Button onClick={handleCreate}>Crea</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => (
          <button key={g.id} onClick={() => setOpenId(g.id)} className="text-left">
            <GlassCard className="p-5 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="text-3xl mb-2">{g.emoji}</div>
              <p className="font-semibold">{g.name}</p>
              {g.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>}
            </GlassCard>
          </button>
        ))}
        {groups.length === 0 && (
          <GlassCard className="p-8 col-span-full text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nessun gruppo. Crea il primo per dividere spese con altri.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function GroupDetail({ group, currencySymbol, onBack, onDelete }: { group: SharedGroup; currencySymbol: string; onBack: () => void; onDelete: () => void }) {
  const { user } = useAuth();
  const { members, expenses, splits, addExpense, deleteExpense, togglePaid, createInvite, computeBalances } = useGroupDetails(group.id);
  const [expOpen, setExpOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', category: 'other' });

  const handleInvite = async () => {
    const token = await createInvite();
    if (token) {
      const url = `${window.location.origin}/?invite=${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copiato! Condividilo con chi vuoi invitare');
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.description) { toast.error('Compila tutti i campi'); return; }
    if (members.length === 0) { toast.error('Aggiungi prima dei membri'); return; }
    await addExpense({ amount, description: form.description, category: form.category, splitType: 'equal' });
    setForm({ amount: '', description: '', category: 'other' });
    setExpOpen(false);
  };

  const balances = computeBalances();
  const myBalance = user ? (balances[user.id] || 0) : 0;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Indietro
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleInvite}><UserPlus className="w-4 h-4 mr-2" />Invita</Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">{group.emoji}</div>
          <div>
            <h2 className="font-display text-2xl font-bold">{group.name}</h2>
            {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div>
            <p className="text-xs text-muted-foreground">Membri</p>
            <p className="font-semibold text-lg">{members.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spese totali</p>
            <p className="font-semibold text-lg">{currencySymbol}{totalExpenses.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tuo saldo</p>
            <p className={`font-semibold text-lg ${myBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {myBalance >= 0 ? '+' : ''}{currencySymbol}{myBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <h3 className="font-semibold mb-3">Saldi</h3>
          <div className="space-y-2">
            {members.map(m => {
              const b = balances[m.user_id] || 0;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm">{m.display_name || (m.user_id === user?.id ? 'Tu' : m.user_id.slice(0, 8))}</span>
                  <span className={`font-medium ${b >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {b >= 0 ? '+' : ''}{currencySymbol}{b.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Spese</h3>
            <Dialog open={expOpen} onOpenChange={setExpOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Aggiungi</Button>
              </DialogTrigger>
              <DialogContent className="glass-panel-elevated border-0">
                <DialogHeader><DialogTitle>Nuova spesa</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Descrizione" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Importo" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  <p className="text-xs text-muted-foreground">Verrà divisa equamente tra {members.length} {members.length === 1 ? 'membro' : 'membri'}.</p>
                </div>
                <DialogFooter><Button onClick={handleAddExpense}>Aggiungi</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {expenses.map(e => {
              const expSplits = splits.filter(s => s.expense_id === e.id);
              return (
                <div key={e.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Pagato da {e.paid_by === user?.id ? 'te' : (members.find(m => m.user_id === e.paid_by)?.display_name || 'altro')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currencySymbol}{e.amount.toFixed(2)}</p>
                      {e.paid_by === user?.id && (
                        <button onClick={() => deleteExpense(e.id)} className="text-xs text-destructive">Elimina</button>
                      )}
                    </div>
                  </div>
                  {expSplits.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      {expSplits.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {s.user_id === user?.id ? 'Tu' : (members.find(m => m.user_id === s.user_id)?.display_name || s.user_id.slice(0, 6))}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{currencySymbol}{s.amount.toFixed(2)}</span>
                            <button
                              onClick={() => togglePaid(s.id, !s.paid)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${s.paid ? 'bg-success border-success' : 'border-white/20'}`}
                            >
                              {s.paid && <Check className="w-3 h-3 text-background" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {expenses.length === 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">Nessuna spesa ancora</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
