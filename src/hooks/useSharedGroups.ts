import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

export interface SharedGroup {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  emoji: string;
  type: string;
  currency: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string | null;
  role: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  split_type: string;
  notes: string | null;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  paid: boolean;
}

const db = supabase as any;

export function useSharedGroups() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<SharedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated || !user) { setGroups([]); setLoading(false); return; }
    try {
      const { data, error } = await db.from('shared_groups').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGroups(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Consume a pending invite (self-join is only possible through a valid invite)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('pendingInvite') : null;
    if (!token) return;
    sessionStorage.removeItem('pendingInvite');
    (async () => {
      const { error } = await db.rpc('join_group_with_invite', { _token: token });
      if (error) {
        toast.error(t('groups.error', { message: error.message }));
        return;
      }
      toast.success(t('groups.joined', { defaultValue: 'Sei entrato nel gruppo' }));
      fetchGroups();
    })();
  }, [isAuthenticated, user, fetchGroups, t]);

  const createGroup = useCallback(async (input: Pick<SharedGroup, 'name' | 'description' | 'emoji' | 'type' | 'currency'>) => {
    if (!user) return null;
    try {
      const { data, error } = await db.from('shared_groups').insert({
        owner_id: user.id, ...input,
      }).select().single();
      if (error) throw error;
      setGroups(prev => [data, ...prev]);
      toast.success(t('groups.created'));
      return data as SharedGroup;
    } catch (e: any) {
      toast.error(t('groups.error', { message: e.message }));
      return null;
    }
  }, [user, t]);

  const deleteGroup = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await db.from('shared_groups').delete().eq('id', id);
      if (error) throw error;
      setGroups(prev => prev.filter(g => g.id !== id));
      toast.success(t('groups.deleted'));
    } catch (e: any) {
      toast.error(t('groups.error', { message: e.message }));
    }
  }, [user, t]);

  return { groups, loading, createGroup, deleteGroup, refetch: fetchGroups };
}

export function useGroupDetails(groupId: string | null) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!groupId || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [m, e] = await Promise.all([
        db.from('group_members').select('*').eq('group_id', groupId),
        db.from('group_expenses').select('*').eq('group_id', groupId).order('date', { ascending: false }),
      ]);
      setMembers(m.data || []);
      setExpenses((e.data || []).map((x: any) => ({ ...x, amount: Number(x.amount) })));
      const expIds = (e.data || []).map((x: any) => x.id);
      if (expIds.length > 0) {
        const { data: sData } = await db.from('expense_splits').select('*').in('expense_id', expIds);
        setSplits((sData || []).map((s: any) => ({ ...s, amount: Number(s.amount) })));
      } else {
        setSplits([]);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addExpense = useCallback(async (input: {
    amount: number;
    description: string;
    category: string;
    splitType: 'equal' | 'custom';
    customSplits?: { user_id: string; amount: number }[];
  }) => {
    if (!groupId || !user) return;
    try {
      const { data: exp, error } = await db.from('group_expenses').insert({
        group_id: groupId,
        paid_by: user.id,
        amount: input.amount,
        description: input.description,
        category: input.category,
        split_type: input.splitType,
      }).select().single();
      if (error) throw error;

      let splitsToInsert: { expense_id: string; user_id: string; amount: number; paid: boolean }[] = [];
      if (input.splitType === 'equal') {
        const per = input.amount / members.length;
        splitsToInsert = members.map(m => ({
          expense_id: exp.id,
          user_id: m.user_id,
          amount: Number(per.toFixed(2)),
          paid: m.user_id === user.id,
        }));
      } else if (input.customSplits) {
        splitsToInsert = input.customSplits.map(s => ({
          expense_id: exp.id,
          user_id: s.user_id,
          amount: s.amount,
          paid: s.user_id === user.id,
        }));
      }
      if (splitsToInsert.length > 0) {
        await db.from('expense_splits').insert(splitsToInsert);
      }
      await fetch();
      toast.success(t('groups.added'));
    } catch (e: any) {
      toast.error(t('groups.error', { message: e.message }));
    }
  }, [groupId, user, members, fetch, t]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await db.from('group_expenses').delete().eq('id', id);
      await fetch();
      toast.success(t('groups.expenseDeleted'));
    } catch (e: any) {
      toast.error(t('groups.error', { message: e.message }));
    }
  }, [fetch, t]);

  const togglePaid = useCallback(async (splitId: string, paid: boolean) => {
    try {
      await db.from('expense_splits').update({ paid, paid_at: paid ? new Date().toISOString() : null }).eq('id', splitId);
      setSplits(prev => prev.map(s => s.id === splitId ? { ...s, paid } : s));
    } catch (e: any) {
      toast.error(t('groups.error', { message: e.message }));
    }
  }, [t]);

  const createInvite = useCallback(async (): Promise<string | null> => {
    if (!groupId || !user) return null;
    try {
      const { data, error } = await db.from('group_invites').insert({
        group_id: groupId, created_by: user.id,
      }).select().single();
      if (error) throw error;
      return data.token;
    } catch (e: any) {
      toast.error(t('groups.error', { message: e.message }));
      return null;
    }
  }, [groupId, user, t]);

  // Compute balances: positive = others owe me, negative = I owe
  const computeBalances = useCallback(() => {
    const balance: Record<string, number> = {};
    members.forEach(m => { balance[m.user_id] = 0; });
    expenses.forEach(exp => {
      const expSplits = splits.filter(s => s.expense_id === exp.id);
      expSplits.forEach(s => {
        if (s.user_id === exp.paid_by) {
          balance[exp.paid_by] = (balance[exp.paid_by] || 0) + (exp.amount - s.amount);
        } else if (!s.paid) {
          balance[exp.paid_by] = (balance[exp.paid_by] || 0) + s.amount;
          balance[s.user_id] = (balance[s.user_id] || 0) - s.amount;
        }
      });
    });
    return balance;
  }, [members, expenses, splits]);

  return { members, expenses, splits, loading, addExpense, deleteExpense, togglePaid, createInvite, computeBalances, refetch: fetch };
}
