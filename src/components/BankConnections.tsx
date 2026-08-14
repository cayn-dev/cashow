import { useCallback, useEffect, useState } from 'react';
import { Building2, Link2, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface Institution {
  id: string;
  name: string;
  logo?: string;
}

interface Connection {
  id: string;
  institution_name: string | null;
  institution_logo: string | null;
  status: string;
  last_synced_at: string | null;
}

const db = supabase as any;

async function callBankLink(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('bank-link', {
    body: { action, ...params },
  });
  if (error) {
    let details = error.message;
    try {
      const ctx = (error as any).context;
      if (ctx?.text) details = await ctx.text();
    } catch { /* ignore */ }
    throw new Error(details);
  }
  if ((data as any)?.error) throw new Error((data as any).details || (data as any).error);
  return data as any;
}

export function BankConnections() {
  const { t } = useLanguage();
  const { isAuthenticated, isGuest } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [query, setQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const canUse = isAuthenticated && !isGuest;

  const fetchConnections = useCallback(async () => {
    if (!canUse) return;
    const { data } = await db
      .from('bank_connections')
      .select('id, institution_name, institution_logo, status, last_synced_at')
      .order('created_at', { ascending: true });
    setConnections(data || []);
  }, [canUse]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const openPicker = async () => {
    setPickerOpen(true);
    if (institutions.length) return;
    setLoadingList(true);
    try {
      const res = await callBankLink('institutions', { country: 'it' });
      setInstitutions(res.institutions || []);
    } catch (e: any) {
      toast.error(t('bank.errorList'), { description: e.message });
    } finally {
      setLoadingList(false);
    }
  };

  const connectBank = async (inst: Institution) => {
    setBusy(inst.id);
    try {
      const res = await callBankLink('connect', {
        institutionId: inst.id,
        institutionName: inst.name,
        institutionLogo: inst.logo,
        redirect: `${window.location.origin}/?bank=connected`,
      });
      window.location.href = res.link;
    } catch (e: any) {
      toast.error(t('bank.errorConnect'), { description: e.message });
      setBusy(null);
    }
  };

  const syncAll = async () => {
    setBusy('sync');
    try {
      const res = await callBankLink('sync');
      toast.success(t('bank.synced', { count: String(res.imported ?? 0) }));
      await fetchConnections();
    } catch (e: any) {
      toast.error(t('bank.errorSync'), { description: e.message });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (id: string) => {
    setBusy(id);
    try {
      await callBankLink('disconnect', { connectionId: id });
      toast.success(t('bank.disconnected'));
      await fetchConnections();
    } catch (e: any) {
      toast.error(t('bank.errorDisconnect'), { description: e.message });
    } finally {
      setBusy(null);
    }
  };

  const filtered = institutions.filter((i) =>
    i.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex items-start gap-3 mb-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{t('bank.title')}</h3>
          <p className="text-sm text-muted-foreground break-words">{t('bank.desc')}</p>
        </div>
      </div>

      {!canUse ? (
        <p className="text-sm text-muted-foreground">{t('bank.needAccount')}</p>
      ) : (
        <>
          {connections.length > 0 && (
            <div className="space-y-2 mb-3">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                >
                  {c.institution_logo ? (
                    <img src={c.institution_logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/90 p-0.5" />
                  ) : (
                    <Building2 className="w-8 h-8 p-1.5 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.institution_name || '—'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.status === 'linked' ? t('bank.statusLinked') : t('bank.statusPending')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('bank.disconnect')}
                    disabled={busy === c.id}
                    onClick={() => disconnect(c.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={openPicker} className="flex-1 gap-2">
              <Link2 className="w-4 h-4" />
              {t('bank.connect')}
            </Button>
            {connections.length > 0 && (
              <Button variant="outline" onClick={syncAll} disabled={busy === 'sync'} className="gap-2">
                {busy === 'sync' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('bank.sync')}
              </Button>
            )}
          </div>
        </>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="bg-background sm:max-w-[420px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('bank.pickTitle')}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('bank.search')}
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loadingList && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingList && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t('bank.noResults')}</p>
            )}
            {filtered.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => connectBank(inst)}
                disabled={busy === inst.id}
                className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left hover:bg-white/[0.07] transition-colors"
              >
                {inst.logo ? (
                  <img src={inst.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/90 p-0.5" />
                ) : (
                  <Building2 className="w-8 h-8 p-1.5 text-primary" />
                )}
                <span className="text-sm font-medium flex-1 truncate">{inst.name}</span>
                {busy === inst.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
