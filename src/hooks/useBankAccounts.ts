import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  bank_name: string | null;
  icon: string;
  color: string;
  current_balance: number;
  initial_balance: number;
  currency: string;
  is_active: boolean;
}

const db = supabase as any;
const LOCAL_KEY = 'finance_local_accounts';

function readLocal(): BankAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as BankAccount[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: BankAccount[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

export function useBankAccounts() {
  const { user, isAuthenticated, isGuest } = useAuth();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Guest / signed-out users keep their accounts locally so the section still works.
  const localMode = !isAuthenticated || !user || isGuest;

  const fetchAccounts = useCallback(async () => {
    if (localMode) {
      setAccounts(readLocal());
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await db
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setAccounts((data || []).map((a: any) => ({
        ...a,
        current_balance: Number(a.current_balance),
        initial_balance: Number(a.initial_balance),
      })));
    } catch (e: any) {
      console.error('fetch accounts', e);
      toast.error(t('accounts.error', { msg: e?.message ?? 'unknown' }));
    } finally {
      setLoading(false);
    }
  }, [user, localMode, t]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const addAccount = useCallback(async (input: Omit<BankAccount, 'id' | 'current_balance'> & { current_balance?: number }) => {
    if (localMode) {
      const created: BankAccount = {
        ...input,
        id: crypto.randomUUID(),
        current_balance: input.current_balance ?? input.initial_balance,
      };
      const next = [...readLocal(), created];
      writeLocal(next);
      setAccounts(next);
      toast.success(t('accounts.added'));
      return;
    }
    try {
      const { data, error } = await db.from('bank_accounts').insert({
        user_id: user!.id,
        name: input.name,
        type: input.type,
        bank_name: input.bank_name,
        icon: input.icon,
        color: input.color,
        initial_balance: input.initial_balance,
        current_balance: input.current_balance ?? input.initial_balance,
        currency: input.currency,
        is_active: input.is_active,
      }).select().single();
      if (error) throw error;
      setAccounts(prev => [...prev, { ...data, current_balance: Number(data.current_balance), initial_balance: Number(data.initial_balance) }]);
      toast.success(t('accounts.added'));
    } catch (e: any) {
      console.error('add account', e);
      toast.error(t('accounts.error', { msg: e?.message ?? 'unknown' }));
    }
  }, [user, localMode, t]);

  const updateAccount = useCallback(async (id: string, updates: Partial<BankAccount>) => {
    if (localMode) {
      const next = readLocal().map(a => (a.id === id ? { ...a, ...updates } : a));
      writeLocal(next);
      setAccounts(next);
      return;
    }
    try {
      const { error } = await db.from('bank_accounts').update(updates).eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } as BankAccount : a));
    } catch (e: any) {
      toast.error(t('accounts.error', { msg: e?.message ?? 'unknown' }));
    }
  }, [user, localMode, t]);

  const deleteAccount = useCallback(async (id: string) => {
    if (localMode) {
      const next = readLocal().filter(a => a.id !== id);
      writeLocal(next);
      setAccounts(next);
      toast.success(t('accounts.deleted'));
      return;
    }
    try {
      const { error } = await db.from('bank_accounts').delete().eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast.success(t('accounts.deleted'));
    } catch (e: any) {
      toast.error(t('accounts.error', { msg: e?.message ?? 'unknown' }));
    }
  }, [user, localMode, t]);

  return { accounts, loading, localMode, addAccount, updateAccount, deleteAccount, refetch: fetchAccounts };
}
