import { useMemo } from 'react';
import { Transaction, CategoryType, CATEGORY_CONFIG, FinanceInsight } from '@/types/finance';

export function useInsights(transactions: Transaction[]) {
  const insights = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get transactions for current and last month
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'expense';
    });

    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear && t.type === 'expense';
    });

    const generatedInsights: FinanceInsight[] = [];

    // Calculate total expenses
    const currentTotal = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const lastTotal = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Overall spending comparison
    if (lastTotal > 0) {
      const percentChange = ((currentTotal - lastTotal) / lastTotal) * 100;
      
      if (percentChange > 15) {
        generatedInsights.push({
          id: 'overall-increase',
          type: 'spending_increase',
          message: `Le tue spese sono aumentate del ${Math.round(percentChange)}% rispetto al mese scorso`,
          percentChange: Math.round(percentChange),
          createdAt: new Date(),
        });
      } else if (percentChange < -15) {
        generatedInsights.push({
          id: 'overall-decrease',
          type: 'spending_decrease',
          message: `Ottimo! Hai speso il ${Math.round(Math.abs(percentChange))}% in meno rispetto al mese scorso`,
          percentChange: Math.round(percentChange),
          createdAt: new Date(),
        });
      }
    }

    // Category-specific insights
    const categoryExpenses: Record<CategoryType, { current: number; last: number }> = {} as Record<CategoryType, { current: number; last: number }>;
    
    Object.keys(CATEGORY_CONFIG).forEach((cat) => {
      const category = cat as CategoryType;
      categoryExpenses[category] = {
        current: currentMonthTransactions
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + t.amount, 0),
        last: lastMonthTransactions
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + t.amount, 0),
      };
    });

    // Find significant category changes
    Object.entries(categoryExpenses).forEach(([cat, expenses]) => {
      const category = cat as CategoryType;
      if (expenses.last > 50 && expenses.current > 50) {
        const percentChange = ((expenses.current - expenses.last) / expenses.last) * 100;
        
        if (percentChange > 25) {
          const config = CATEGORY_CONFIG[category];
          generatedInsights.push({
            id: `category-increase-${category}`,
            type: 'category_alert',
            message: `Hai speso il ${Math.round(percentChange)}% in più in ${config.emoji} ${config.label}`,
            category,
            percentChange: Math.round(percentChange),
            createdAt: new Date(),
          });
        } else if (percentChange < -25) {
          const config = CATEGORY_CONFIG[category];
          generatedInsights.push({
            id: `category-decrease-${category}`,
            type: 'spending_decrease',
            message: `Ben fatto! Hai risparmiato il ${Math.round(Math.abs(percentChange))}% in ${config.emoji} ${config.label}`,
            category,
            percentChange: Math.round(percentChange),
            createdAt: new Date(),
          });
        }
      }
    });

    // Top spending category
    const topCategory = Object.entries(categoryExpenses)
      .filter(([_, exp]) => exp.current > 0)
      .sort((a, b) => b[1].current - a[1].current)[0];
    
    if (topCategory && topCategory[1].current > 100) {
      const config = CATEGORY_CONFIG[topCategory[0] as CategoryType];
      generatedInsights.push({
        id: 'top-category',
        type: 'tip',
        message: `La tua spesa maggiore è ${config.emoji} ${config.label}: €${Math.round(topCategory[1].current).toLocaleString()}`,
        category: topCategory[0] as CategoryType,
        createdAt: new Date(),
      });
    }

    // Recurring expenses warning
    const recurringTotal = currentMonthTransactions
      .filter(t => t.recurrence !== 'none')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (recurringTotal > 0 && currentTotal > 0) {
      const recurringPercent = (recurringTotal / currentTotal) * 100;
      if (recurringPercent > 40) {
        generatedInsights.push({
          id: 'recurring-warning',
          type: 'tip',
          message: `Il ${Math.round(recurringPercent)}% delle tue spese sono ricorrenti. Controlla gli abbonamenti!`,
          createdAt: new Date(),
        });
      }
    }

    // Daily average insight
    const daysInMonth = now.getDate();
    const dailyAverage = currentTotal / daysInMonth;
    const projectedMonthly = dailyAverage * 30;
    
    if (dailyAverage > 0 && lastTotal > 0) {
      if (projectedMonthly > lastTotal * 1.2) {
        generatedInsights.push({
          id: 'projected-overspend',
          type: 'spending_increase',
          message: `Al ritmo attuale, spenderai circa €${Math.round(projectedMonthly).toLocaleString()} questo mese`,
          createdAt: new Date(),
        });
      }
    }

    return generatedInsights.slice(0, 5); // Limit to 5 insights
  }, [transactions]);

  return insights;
}
