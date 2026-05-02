import { useState } from 'react';
import { useSharedGroups, useGroupDetails, SharedGroup } from '@/hooks/useSharedGroups';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, ArrowLeft, UserPlus, Trash2, Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface GroupsViewProps {
  currencySymbol?: string;
}

export function GroupsView({ currencySymbol = '€' }: GroupsViewProps) {
  const { t } = useLanguage();
  const { groups, createGroup, deleteGroup } = useSharedGroups();
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', emoji: '👥', type: 'group' });

  const handleCreate = async () => {
    if (!form.name) { toast.error(t('groups.nameRequired')); return; }
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
          <h1 className="font-display text-3xl xl:text-4xl font-bold">{t('groups.title')}</h1>
          <p className="text-muted-foreground">{t('groups.subtitle')}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Plus className="w-4 h-4 mr-2" /> {t('groups.new')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-elevated border-0">
            <DialogHeader><DialogTitle>{t('groups.new')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input className="w-20 text-center text-2xl" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value.slice(0, 2) })} />
                <Input className="flex-1" placeholder={t('groups.namePlaceholder')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>{t('groups.type')}</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">{t('groups.typeGeneric')}</SelectItem>
                    <SelectItem value="couple">{t('groups.typeCouple')}</SelectItem>
                    <SelectItem value="roommates">{t('groups.typeRoommates')}</SelectItem>
                    <SelectItem value="trip">{t('groups.typeTrip')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder={t('groups.descPlaceholder')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter><Button onClick={handleCreate}>{t('groups.create')}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <p>{t('groups.empty')}</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function GroupDetail({ group, currencySymbol, onBack, onDelete }: { group: SharedGroup; currencySymbol: string; onBack: () => void; onDelete: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { members, expenses, splits, addExpense, deleteExpense, togglePaid, createInvite, computeBalances } = useGroupDetails(group.id);
  const [expOpen, setExpOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [form, setForm] = useState({ amount: '', description: '', category: 'other' });

  const handleOpenInvite = async () => {
    setInviteOpen(true);
    setInviteUrl('');
    const token = await createInvite();
    if (token) {
      setInviteUrl(`${window.location.origin}/?invite=${token}`);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('groups.inviteCopied'));
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = inviteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success(t('groups.inviteCopied'));
    }
  };

  const handleNativeShare = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text: `${group.emoji} ${group.name}`, url: inviteUrl });
      } catch { /* user cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(inviteUrl)}`, '_blank');
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.description) { toast.error(t('groups.fillAll')); return; }
    if (members.length === 0) { toast.error(t('groups.addMembersFirst')); return; }
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
          <ArrowLeft className="w-4 h-4" /> {t('groups.back')}
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenInvite}><UserPlus className="w-4 h-4 mr-2" />{t('groups.invite')}</Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="glass-panel-elevated border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />{t('groups.inviteTitle')}</DialogTitle>
            <DialogDescription>{t('groups.inviteDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={inviteUrl}
                readOnly
                placeholder="..."
                className="font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button onClick={handleCopy} disabled={!inviteUrl} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleNativeShare} disabled={!inviteUrl} className="w-full" variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              {t('groups.copyLink')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <p className="text-xs text-muted-foreground">{t('groups.members')}</p>
            <p className="font-semibold text-lg">{members.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('groups.totalExpenses')}</p>
            <p className="font-semibold text-lg">{currencySymbol}{totalExpenses.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('groups.yourBalance')}</p>
            <p className={`font-semibold text-lg ${myBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {myBalance >= 0 ? '+' : ''}{currencySymbol}{myBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <h3 className="font-semibold mb-3">{t('groups.balances')}</h3>
          <div className="space-y-2">
            {members.map(m => {
              const b = balances[m.user_id] || 0;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm">{m.display_name || (m.user_id === user?.id ? t('groups.you') : m.user_id.slice(0, 8))}</span>
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
            <h3 className="font-semibold">{t('groups.expenses')}</h3>
            <Dialog open={expOpen} onOpenChange={setExpOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />{t('groups.addExpense')}</Button>
              </DialogTrigger>
              <DialogContent className="glass-panel-elevated border-0">
                <DialogHeader><DialogTitle>{t('groups.newExpense')}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder={t('groups.expenseDesc')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  <Input type="number" step="0.01" placeholder={t('groups.expenseAmount')} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t('groups.splitInfo', { count: members.length })}</p>
                </div>
                <DialogFooter><Button onClick={handleAddExpense}>{t('groups.addExpense')}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {expenses.map(e => {
              const expSplits = splits.filter(s => s.expense_id === e.id);
              const payerName = e.paid_by === user?.id ? t('groups.you') : (members.find(m => m.user_id === e.paid_by)?.display_name || '—');
              return (
                <div key={e.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{t('groups.paidBy', { name: payerName })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currencySymbol}{e.amount.toFixed(2)}</p>
                      {e.paid_by === user?.id && (
                        <button onClick={() => deleteExpense(e.id)} className="text-xs text-destructive">{t('groups.delete')}</button>
                      )}
                    </div>
                  </div>
                  {expSplits.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      {expSplits.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {s.user_id === user?.id ? t('groups.you') : (members.find(m => m.user_id === s.user_id)?.display_name || s.user_id.slice(0, 6))}
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
              <p className="text-center text-muted-foreground py-6 text-sm">{t('groups.noExpenses')}</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
