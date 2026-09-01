import { useCallback, useEffect, useState } from 'react';
import { CustomCategory, CUSTOM_CATEGORIES_KEY, readCustomCategories } from '@/types/finance';

/**
 * Global custom-category store.
 * Kept module-level so every component (settings, transaction form, lists)
 * shares the exact same list and updates instantly — previously each hook
 * instance had its own state, so a category created in Settings never
 * showed up anywhere else.
 */
let store: CustomCategory[] = readCustomCategories();
const listeners = new Set<(v: CustomCategory[]) => void>();

function persist(next: CustomCategory[]) {
  store = next;
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
  } catch {
    /* storage full / unavailable */
  }
  listeners.forEach((l) => l(next));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CUSTOM_CATEGORIES_KEY) {
      store = readCustomCategories();
      listeners.forEach((l) => l(store));
    }
  });
}

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>(store);

  useEffect(() => {
    listeners.add(setCategories);
    setCategories(store);
    return () => {
      listeners.delete(setCategories);
    };
  }, []);

  const addCategory = useCallback((cat: Omit<CustomCategory, 'id'>): CustomCategory => {
    const created: CustomCategory = { ...cat, id: crypto.randomUUID() };
    persist([...store, created]);
    return created;
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<CustomCategory>) => {
    persist(store.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCategory = useCallback((id: string) => {
    persist(store.filter((c) => c.id !== id));
  }, []);

  return { categories, addCategory, updateCategory, removeCategory };
}
