import { useState, useEffect, useCallback, useRef } from 'react';
import { tt } from '@/lib/i18nToast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { netMonthlySalary, type SalaryFrequency } from '@/lib/salary';
import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';
import { toast } from 'sonner';


const CACHE_KEY = 'finance_cache';

// Database row types
interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string | null;
  is_salary: boolean | null;
  recurring_source_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbSavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  emoji: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

interface DbProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  monthly_salary: number | null;
  salary_amount: number | null;
  salary_frequency: string | null;
  salary_is_gross: boolean | null;
  currency_symbol: string | null;
  created_at: string;
  updated_at: string;
}


interface FinanceStoreState {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlySalary: number;
  loading: boolean;
}

interface CachedData {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlySalary: number;
  userId: string;
  cachedAt: string;
}

// Helper to cast supabase client for untyped tables
const db = supabase as any;

const loadCache = (userId: string): CachedData | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedData;
    if (cached.userId !== userId) return null;
    // Rehydrate dates
    cached.transactions = cached.transactions.map(t => ({
      ...t,
      date: new Date(t.date),
    }));
    cached.savingsGoals = cached.savingsGoals.map(g => ({
      ...g,
      createdAt: new Date(g.createdAt),
      deadline: g.deadline ? new Date(g.deadline) : undefined,
    }));
    return cached;
  } catch {
    return null;
  }
};

const saveCache = (data: CachedData) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full — silently ignore
  }
};

export function useSupabaseFinanceStore() {
  const { user, isAuthenticated } = useAuth();
  const cacheLoaded = useRef(false);

  const [state, setState] = useState<FinanceStoreState>(() => {
    // Try loading from cache immediately for instant UI
    if (typeof window !== 'undefined' && user?.id) {
      const cached = loadCache(user.id);
      if (cached) {
        cacheLoaded.current = true;
        return {
          transactions: cached.transactions,
          savingsGoals: cached.savingsGoals,
          monthlySalary: cached.monthlySalary,
          loading: false, // show cached data immediately, sync in background
        };
      }
    }
    return { transactions: [], savingsGoals: [], monthlySalary: 0, loading: true };
  });
 
  // Fetch from cloud and update cache
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchData = async () => {
      // Only show loading spinner if we have no cached data
      if (!cacheLoaded.current) {
        setState(prev => ({ ...prev, loading: true }));
      }
      
      try {
        const { data: txData, error: txError } = await db
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }) as { data: DbTransaction[] | null; error: any };

        if (txError) throw txError;

        const { data: goalsData, error: goalsError } = await db
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) as { data: DbSavingsGoal[] | null; error: any };

        if (goalsError) throw goalsError;

        const { data: profileData, error: profileError } = await db
          .from('profiles')
          .select('monthly_salary, salary_amount, salary_frequency, salary_is_gross')
          .eq('user_id', user.id)
          .single() as { data: DbProfile | null; error: any };


        if (profileError && profileError?.code !== 'PGRST116') throw profileError;

        const transactions: Transaction[] = (txData || []).map((t: DbTransaction) => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          category: t.category as CategoryType,
          description: t.description,
          date: new Date(t.date),
          paymentMethod: (t.payment_method || 'cash') as any,
          recurrence: 'none' as const,
          isSalary: t.is_salary || false,
        }));

        const savingsGoals: SavingsGoal[] = (goalsData || []).map((g: DbSavingsGoal) => ({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount),
          emoji: g.emoji || '🎯',
          createdAt: new Date(g.created_at),
          deadline: g.deadline ? new Date(g.deadline) : undefined,
        }));

        const monthlySalary = profileData?.monthly_salary ? Number(profileData.monthly_salary) : 0;

        setSalaryConfig({
          amount: profileData?.salary_amount ? Number(profileData.salary_amount) : 0,
          frequency: (profileData?.salary_frequency as SalaryFrequency) || 'monthly',
          isGross: !!profileData?.salary_is_gross,
        });

        setState({ transactions, savingsGoals, monthlySalary, loading: false });


        // Persist to local cache
        saveCache({
          transactions,
          savingsGoals,
          monthlySalary,
          userId: user.id,
          cachedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error fetching finance data:', error);
        if (!cacheLoaded.current) {
          toast.error(tt('toast.loadError'));
        }
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  // Keep local cache in sync with state changes
  useEffect(() => {
    if (!user?.id || state.loading) return;
    saveCache({
      transactions: state.transactions,
      savingsGoals: state.savingsGoals,
      monthlySalary: state.monthlySalary,
      userId: user.id,
      cachedAt: new Date().toISOString(),
    });
  }, [state.transactions, state.savingsGoals, state.monthlySalary, user?.id, state.loading]);

   // Add transaction
   const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
     if (!user) return;
 
     try {
       const { data, error } = await db
         .from('transactions')
         .insert({
           user_id: user.id,
           type: transaction.type,
           amount: transaction.amount,
           category: transaction.category,
           description: transaction.description,
           date: transaction.date.toISOString(),
           payment_method: transaction.paymentMethod,
           is_salary: transaction.isSalary || false,
         })
         .select()
         .single() as { data: DbTransaction | null; error: any };
 
       if (error || !data) throw error || new Error('No data returned');
 
       const newTransaction: Transaction = {
         id: data.id,
         type: data.type as 'income' | 'expense',
         amount: Number(data.amount),
         category: data.category as CategoryType,
         description: data.description,
         date: new Date(data.date),
         paymentMethod: (data.payment_method || 'cash') as any,
         recurrence: 'none' as const,
         isSalary: data.is_salary || false,
       };
 
       setState(prev => ({
         ...prev,
         transactions: [newTransaction, ...prev.transactions],
       }));
 
       toast.success(tt('toast.transactionAdded'));
     } catch (error) {
       console.error('Error adding transaction:', error);
       toast.error(tt('toast.transactionAddError'));
     }
   }, [user]);
 
   // Update transaction
   const updateTransaction = useCallback(async (id: string, updates: Omit<Transaction, 'id'>) => {
     if (!user) return;
     try {
       const { error } = await db
         .from('transactions')
         .update({
           type: updates.type,
           amount: updates.amount,
           category: updates.category,
           description: updates.description,
           date: updates.date.toISOString(),
           payment_method: updates.paymentMethod,
           is_salary: updates.isSalary || false,
         })
         .eq('id', id)
         .eq('user_id', user.id);

       if (error) throw error;

       setState(prev => ({
         ...prev,
         transactions: prev.transactions.map(t =>
           t.id === id ? { ...updates, id } : t
         ),
       }));

       toast.success(tt('toast.transactionUpdated') || 'Saved');
     } catch (error) {
       console.error('Error updating transaction:', error);
       toast.error(tt('toast.updateError'));
     }
   }, [user]);

   // Delete transaction
   const deleteTransaction = useCallback(async (id: string) => {
     if (!user) return;

     try {
       const { error } = await db
         .from('transactions')
         .delete()
         .eq('id', id)
         .eq('user_id', user.id);

       if (error) throw error;

       setState(prev => ({
         ...prev,
         transactions: prev.transactions.filter(t => t.id !== id),
       }));

       toast.success(tt('toast.transactionDeleted'));
     } catch (error) {
       console.error('Error deleting transaction:', error);
       toast.error(tt('toast.deleteError'));
     }
   }, [user]);
 
   // Add savings goal
   const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
     if (!user) return;
 
     try {
       const { data, error } = await db
         .from('savings_goals')
         .insert({
           user_id: user.id,
           name: goal.name,
           target_amount: goal.targetAmount,
           current_amount: goal.currentAmount,
           emoji: goal.emoji,
           deadline: goal.deadline?.toISOString(),
         })
         .select()
         .single() as { data: DbSavingsGoal | null; error: any };
 
       if (error || !data) throw error || new Error('No data returned');
 
       const newGoal: SavingsGoal = {
         id: data.id,
         name: data.name,
         targetAmount: Number(data.target_amount),
         currentAmount: Number(data.current_amount),
         emoji: data.emoji || '🎯',
         createdAt: new Date(data.created_at),
         deadline: data.deadline ? new Date(data.deadline) : undefined,
       };
 
       setState(prev => ({
         ...prev,
         savingsGoals: [...prev.savingsGoals, newGoal],
       }));
 
       toast.success(tt('toast.goalCreated'));
     } catch (error) {
       console.error('Error adding goal:', error);
       toast.error(tt('toast.goalCreateError'));
     }
   }, [user]);
 
   // Update savings goal amount
   const updateSavingsGoal = useCallback(async (id: string, amountToAdd: number) => {
     if (!user) return;
 
     const goal = state.savingsGoals.find(g => g.id === id);
     if (!goal) return;
 
     const newAmount = goal.currentAmount + amountToAdd;
 
     try {
       const { error } = await db
         .from('savings_goals')
         .update({ current_amount: newAmount })
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setState(prev => ({
         ...prev,
         savingsGoals: prev.savingsGoals.map(g =>
           g.id === id ? { ...g, currentAmount: newAmount } : g
         ),
       }));
 
       toast.success(tt('toast.goalUpdated'));
     } catch (error) {
       console.error('Error updating goal:', error);
       toast.error(tt('toast.updateError'));
     }
   }, [user, state.savingsGoals]);
 
   // Delete savings goal
   const deleteSavingsGoal = useCallback(async (id: string) => {
     if (!user) return;
 
     try {
       const { error } = await db
         .from('savings_goals')
         .delete()
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setState(prev => ({
         ...prev,
         savingsGoals: prev.savingsGoals.filter(g => g.id !== id),
       }));
 
       toast.success(tt('toast.goalDeleted'));
     } catch (error) {
       console.error('Error deleting goal:', error);
       toast.error(tt('toast.deleteError'));
     }
   }, [user]);
 
   // Set monthly salary
   const setMonthlySalary = useCallback(async (salary: number) => {
     if (!user) return;
 
     try {
       const { error } = await db
         .from('profiles')
         .update({ monthly_salary: salary })
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setState(prev => ({ ...prev, monthlySalary: salary }));
       toast.success(tt('toast.salaryUpdated'));
     } catch (error) {
       console.error('Error updating salary:', error);
       toast.error(tt('toast.updateError'));
     }
   }, [user]);
 
   // Computed values
   const currentMonthTransactions = state.transactions.filter(t => {
     const now = new Date();
     return t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear();
   });
 
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
 
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
 
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Auto-calculate monthly salary from salary transactions in current month
    const calculatedMonthlySalary = currentMonthTransactions
      .filter(t => t.isSalary)
      .reduce((sum, t) => sum + t.amount, 0);

    const effectiveMonthlySalary = calculatedMonthlySalary > 0 ? calculatedMonthlySalary : state.monthlySalary;
 
   const cumulativeSalary = state.transactions
     .filter(t => t.isSalary)
     .reduce((sum, t) => sum + t.amount, 0);
 
   const totalSavings = state.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
 
   const expensesByCategory = currentMonthTransactions
     .filter(t => t.type === 'expense')
     .reduce((acc, t) => {
       acc[t.category] = (acc[t.category] || 0) + t.amount;
       return acc;
     }, {} as Record<CategoryType, number>);
 
   return {
     transactions: state.transactions,
     savingsGoals: state.savingsGoals,
      monthlySalary: effectiveMonthlySalary,
      loading: state.loading,
     addTransaction,
     deleteTransaction,
     updateTransaction,
     addSavingsGoal,
     updateSavingsGoal,
     deleteSavingsGoal,
     setMonthlySalary,
     // Computed
     currentMonthTransactions,
     monthlyIncome,
     monthlyExpenses,
     monthlyBalance,
     cumulativeSalary,
     totalSavings,
     expensesByCategory,
   };
 }