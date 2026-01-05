import { useState, useEffect } from 'react';
import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';

const STORAGE_KEY = 'finance_data';

interface FinanceData {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlySalary: number;
}

const defaultData: FinanceData = {
  transactions: [],
  savingsGoals: [],
  monthlySalary: 0,
};

// Sample data for demo
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 2500,
    category: 'salary',
    description: 'Stipendio Gennaio',
    date: new Date(2025, 0, 5),
    paymentMethod: 'transfer',
    recurrence: 'monthly',
    isSalary: true,
  },
  {
    id: '2',
    type: 'expense',
    amount: 120,
    category: 'food',
    description: 'Spesa settimanale',
    date: new Date(2025, 0, 3),
    paymentMethod: 'card',
    recurrence: 'weekly',
  },
  {
    id: '3',
    type: 'expense',
    amount: 45,
    category: 'transport',
    description: 'Benzina',
    date: new Date(2025, 0, 2),
    paymentMethod: 'card',
    recurrence: 'none',
  },
  {
    id: '4',
    type: 'expense',
    amount: 89,
    category: 'bills',
    description: 'Bolletta luce',
    date: new Date(2025, 0, 1),
    paymentMethod: 'transfer',
    recurrence: 'monthly',
  },
  {
    id: '5',
    type: 'expense',
    amount: 35,
    category: 'entertainment',
    description: 'Netflix + Spotify',
    date: new Date(2025, 0, 1),
    paymentMethod: 'card',
    recurrence: 'monthly',
  },
  {
    id: '6',
    type: 'income',
    amount: 2500,
    category: 'salary',
    description: 'Stipendio Dicembre',
    date: new Date(2024, 11, 5),
    paymentMethod: 'transfer',
    recurrence: 'monthly',
    isSalary: true,
  },
  {
    id: '7',
    type: 'expense',
    amount: 200,
    category: 'shopping',
    description: 'Abbigliamento',
    date: new Date(2024, 11, 20),
    paymentMethod: 'card',
    recurrence: 'none',
  },
];

const sampleGoals: SavingsGoal[] = [
  {
    id: '1',
    name: 'Nuovo MacBook',
    targetAmount: 2000,
    currentAmount: 850,
    emoji: '💻',
    createdAt: new Date(2024, 9, 1),
  },
  {
    id: '2',
    name: 'Vacanze Estate',
    targetAmount: 1500,
    currentAmount: 600,
    emoji: '🏖️',
    createdAt: new Date(2024, 10, 1),
  },
  {
    id: '3',
    name: 'Fondo Emergenza',
    targetAmount: 5000,
    currentAmount: 2100,
    emoji: '🛡️',
    createdAt: new Date(2024, 6, 1),
  },
];

export function useFinanceStore() {
  const [data, setData] = useState<FinanceData>(() => {
    if (typeof window === 'undefined') return defaultData;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          transactions: parsed.transactions.map((t: Transaction) => ({
            ...t,
            date: new Date(t.date),
          })),
          savingsGoals: parsed.savingsGoals.map((g: SavingsGoal) => ({
            ...g,
            createdAt: new Date(g.createdAt),
            deadline: g.deadline ? new Date(g.deadline) : undefined,
          })),
        };
      } catch {
        return defaultData;
      }
    }
    
    // Return sample data for first time users
    return {
      transactions: sampleTransactions,
      savingsGoals: sampleGoals,
      monthlySalary: 2500,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setData(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setData(prev => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));
  };

  const updateSavingsGoal = (id: string, amount: number) => {
    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(g =>
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    }));
  };

  const deleteSavingsGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(g => g.id !== id),
    }));
  };

  const setMonthlySalary = (salary: number) => {
    setData(prev => ({ ...prev, monthlySalary: salary }));
  };

  // Computed values
  const currentMonthTransactions = data.transactions.filter(t => {
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

  const cumulativeSalary = data.transactions
    .filter(t => t.isSalary)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = data.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  const expensesByCategory = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<CategoryType, number>);

  return {
    transactions: data.transactions,
    savingsGoals: data.savingsGoals,
    monthlySalary: data.monthlySalary,
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
