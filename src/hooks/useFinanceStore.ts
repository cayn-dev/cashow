import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction, SavingsGoal, CategoryType } from '@/types/finance';

const STORAGE_KEY = 'finance_data';
const INITIALIZED_KEY = 'finance_initialized';
const STORAGE_VERSION_KEY = 'finance_data_version';
const BACKUP_KEY = 'finance_data_backup';
const CURRENT_VERSION = 2;

interface FinanceData {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlySalary: number;
  version?: number;
  lastUpdated?: string;
}

const defaultData: FinanceData = {
  transactions: [],
  savingsGoals: [],
  monthlySalary: 0,
  version: CURRENT_VERSION,
  lastUpdated: new Date().toISOString(),
};

// Safely parse stored data with validation
const parseStoredData = (stored: string | null): FinanceData | null => {
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    
    // Validate essential structure
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.transactions)) parsed.transactions = [];
    if (!Array.isArray(parsed.savingsGoals)) parsed.savingsGoals = [];
    if (typeof parsed.monthlySalary !== 'number') parsed.monthlySalary = 0;
    
    return {
      ...parsed,
      transactions: parsed.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date),
      })),
      savingsGoals: parsed.savingsGoals.map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        deadline: g.deadline ? new Date(g.deadline) : undefined,
      })),
      version: parsed.version || 1,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

// Create automatic backup before major operations
const createBackup = () => {
  const currentData = localStorage.getItem(STORAGE_KEY);
  if (currentData) {
    localStorage.setItem(BACKUP_KEY, currentData);
    localStorage.setItem(`${BACKUP_KEY}_timestamp`, new Date().toISOString());
  }
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
  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [data, setData] = useState<FinanceData>(() => {
    if (typeof window === 'undefined') return defaultData;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const wasInitialized = localStorage.getItem(INITIALIZED_KEY);
    
    // Try to parse existing data first
    const parsedData = parseStoredData(stored);
    
    if (parsedData) {
      // Data exists and is valid - use it
      return parsedData;
    }
    
    // Check if we have a backup to restore from
    const backupData = parseStoredData(localStorage.getItem(BACKUP_KEY));
    if (backupData && backupData.transactions.length > 0) {
      console.log('Restored from backup');
      return backupData;
    }
    
    // Only use sample data for FIRST TIME users
    if (!wasInitialized) {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      return {
        transactions: sampleTransactions,
        savingsGoals: sampleGoals,
        monthlySalary: 2500,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
      };
    }
    
    return defaultData;
  });

  // Debounced save to localStorage with backup
  const saveData = useCallback((dataToSave: FinanceData) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(() => {
      // Create backup before saving
      createBackup();
      
      const dataWithMeta = {
        ...dataToSave,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithMeta));
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
    }, 100); // Small debounce to prevent rapid saves
  }, []);

  useEffect(() => {
    // Skip saving on first render to avoid overwriting with stale data
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveData(data);
  }, [data, saveData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

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

  const updateTransaction = (id: string, updates: Omit<Transaction, 'id'>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => (t.id === id ? { ...updates, id } : t)),
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

  // Get statistics for settings
  const getDataStats = useCallback(() => {
    const transactionCount = data.transactions.length;
    const goalsCount = data.savingsGoals.length;
    const oldestTransaction = data.transactions.length > 0
      ? data.transactions.reduce((oldest, t) => t.date < oldest.date ? t : oldest).date
      : null;
    const backupTimestamp = localStorage.getItem(`${BACKUP_KEY}_timestamp`);
    
    return {
      transactionCount,
      goalsCount,
      oldestTransaction,
      lastBackup: backupTimestamp ? new Date(backupTimestamp) : null,
      dataVersion: data.version || 1,
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null,
    };
  }, [data]);

  // Manual backup trigger
  const createManualBackup = useCallback(() => {
    createBackup();
    return localStorage.getItem(`${BACKUP_KEY}_timestamp`);
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(() => {
    const backupData = parseStoredData(localStorage.getItem(BACKUP_KEY));
    if (backupData) {
      setData(backupData);
      return true;
    }
    return false;
  }, []);

  // Clear only transactions (keep goals and settings)
  const clearTransactions = useCallback(() => {
    createBackup();
    setData(prev => ({
      ...prev,
      transactions: [],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Clear only goals (keep transactions)
  const clearGoals = useCallback(() => {
    createBackup();
    setData(prev => ({
      ...prev,
      savingsGoals: [],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Export all data as JSON string
  const exportDataJson = useCallback((): string => {
    const payload = {
      app: 'Cashow',
      exportedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
      settings: localStorage.getItem('finance_settings'),
      customCategories: localStorage.getItem('finance_custom_categories'),
      data,
    };
    return JSON.stringify(payload, null, 2);
  }, [data]);

  // Import data from JSON string. Returns true on success.
  const importDataJson = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      const incoming = parsed.data ?? parsed;
      if (!incoming || !Array.isArray(incoming.transactions)) return false;
      createBackup();
      const restored: FinanceData = {
        transactions: incoming.transactions.map((t: any) => ({ ...t, date: new Date(t.date) })),
        savingsGoals: (incoming.savingsGoals || []).map((g: any) => ({
          ...g,
          createdAt: new Date(g.createdAt),
          deadline: g.deadline ? new Date(g.deadline) : undefined,
        })),
        monthlySalary: typeof incoming.monthlySalary === 'number' ? incoming.monthlySalary : 0,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      setData(restored);
      if (typeof parsed.settings === 'string') {
        localStorage.setItem('finance_settings', parsed.settings);
      }
      if (typeof parsed.customCategories === 'string') {
        localStorage.setItem('finance_custom_categories', parsed.customCategories);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    transactions: data.transactions,
    exportDataJson,
    importDataJson,
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
    // Data management
    getDataStats,
    createManualBackup,
    restoreFromBackup,
    clearTransactions,
    clearGoals,
  };
}
