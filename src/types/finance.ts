export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'card' | 'paypal' | 'transfer' | 'other';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type CategoryType = 
  | 'food' 
  | 'transport' 
  | 'shopping' 
  | 'bills' 
  | 'entertainment' 
  | 'health' 
  | 'salary'
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryType;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceType;
  isSalary?: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  createdAt: Date;
  deadline?: Date;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export const CATEGORY_CONFIG: Record<CategoryType, { label: string; emoji: string; color: string }> = {
  food: { label: 'Cibo', emoji: '🍕', color: 'category-food' },
  transport: { label: 'Trasporti', emoji: '🚗', color: 'category-transport' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: 'category-shopping' },
  bills: { label: 'Bollette', emoji: '📄', color: 'category-bills' },
  entertainment: { label: 'Divertimento', emoji: '🎮', color: 'category-entertainment' },
  health: { label: 'Salute', emoji: '💊', color: 'category-health' },
  salary: { label: 'Stipendio', emoji: '💰', color: 'income' },
  other: { label: 'Altro', emoji: '📦', color: 'category-other' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; emoji: string }> = {
  cash: { label: 'Contanti', emoji: '💵' },
  card: { label: 'Carta', emoji: '💳' },
  paypal: { label: 'PayPal', emoji: '🅿️' },
  transfer: { label: 'Bonifico', emoji: '🏦' },
  other: { label: 'Altro', emoji: '💱' },
};
