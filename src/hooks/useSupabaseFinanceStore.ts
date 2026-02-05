 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';
 import { toast } from 'sonner';
 
 // Database row types (until types.ts regenerates)
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
 
 // Helper to cast supabase client for untyped tables
 const db = supabase as any;
 
 export function useSupabaseFinanceStore() {
   const { user, isAuthenticated } = useAuth();
   const [state, setState] = useState<FinanceStoreState>({
     transactions: [],
     savingsGoals: [],
     monthlySalary: 0,
     loading: true,
   });
 
   // Fetch all data on mount
   useEffect(() => {
     if (!isAuthenticated || !user) {
       setState(prev => ({ ...prev, loading: false }));
       return;
     }
 
     const fetchData = async () => {
       setState(prev => ({ ...prev, loading: true }));
       
       try {
         // Fetch transactions
         const { data: txData, error: txError } = await db
           .from('transactions')
           .select('*')
           .eq('user_id', user.id)
           .order('date', { ascending: false }) as { data: DbTransaction[] | null; error: any };
 
         if (txError) throw txError;
 
         // Fetch savings goals
         const { data: goalsData, error: goalsError } = await db
           .from('savings_goals')
           .select('*')
           .eq('user_id', user.id)
           .order('created_at', { ascending: false }) as { data: DbSavingsGoal[] | null; error: any };
 
         if (goalsError) throw goalsError;
 
         // Fetch profile for salary
         const { data: profileData, error: profileError } = await db
           .from('profiles')
           .select('monthly_salary')
           .eq('user_id', user.id)
           .single() as { data: DbProfile | null; error: any };
 
         if (profileError && profileError?.code !== 'PGRST116') throw profileError;
 
         // Transform data
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
 
         setState({
           transactions,
           savingsGoals,
           monthlySalary: profileData?.monthly_salary ? Number(profileData.monthly_salary) : 0,
           loading: false,
         });
       } catch (error) {
         console.error('Error fetching finance data:', error);
         toast.error('Errore nel caricamento dei dati');
         setState(prev => ({ ...prev, loading: false }));
       }
     };
 
     fetchData();
   }, [user, isAuthenticated]);
 
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
 
       toast.success('Transazione aggiunta');
     } catch (error) {
       console.error('Error adding transaction:', error);
       toast.error('Errore nell\'aggiunta della transazione');
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
 
       toast.success('Transazione eliminata');
     } catch (error) {
       console.error('Error deleting transaction:', error);
       toast.error('Errore nell\'eliminazione');
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
 
       toast.success('Obiettivo creato');
     } catch (error) {
       console.error('Error adding goal:', error);
       toast.error('Errore nella creazione dell\'obiettivo');
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
 
       toast.success('Obiettivo aggiornato');
     } catch (error) {
       console.error('Error updating goal:', error);
       toast.error('Errore nell\'aggiornamento');
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
 
       toast.success('Obiettivo eliminato');
     } catch (error) {
       console.error('Error deleting goal:', error);
       toast.error('Errore nell\'eliminazione');
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
       toast.success('Stipendio aggiornato');
     } catch (error) {
       console.error('Error updating salary:', error);
       toast.error('Errore nell\'aggiornamento');
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
     monthlySalary: state.monthlySalary,
     loading: state.loading,
     addTransaction,
     deleteTransaction,
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