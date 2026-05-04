import { useCallback, useEffect, useState } from 'react';
import { CustomCategory } from '@/types/finance';

const KEY = 'finance_custom_categories';

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CustomCategory[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(categories));
  }, [categories]);

  const addCategory = useCallback((cat: Omit<CustomCategory, 'id'>) => {
    setCategories(prev => [...prev, { ...cat, id: crypto.randomUUID() }]);
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<CustomCategory>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return { categories, addCategory, updateCategory, removeCategory };
}
