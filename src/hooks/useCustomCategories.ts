import { useCallback, useEffect, useState } from 'react';
import { CustomCategory, CUSTOM_CATEGORIES_KEY, readCustomCategories } from '@/types/finance';
import { supabase } from '@/integrations/supabase/client';
import { isDataErasing } from '@/lib/dataErasure';

/**
 * Global custom-category store, cached locally and synced to the cloud so
 * categories survive browser storage eviction (e.g. iOS clearing data after a few days).
 */
let store: CustomCategory[] = readCustomCategories();
let userId: string | null = null;
const listeners = new Set<(v: CustomCategory[]) => void>();

function setStore(next: CustomCategory[]) {
  store = next;
  try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l(next));
}

const toRow = (c: CustomCategory, uid: string) => ({
  id: c.id, user_id: uid, name: c.name, emoji: c.emoji || '🏷️',
  color: c.color || 'category-other', keywords: c.keywords ?? [], updated_at: new Date().toISOString(),
});

async function syncFromCloud(uid: string) {
  const { data, error } = await supabase.from('custom_categories').select('*').eq('user_id', uid);
  if (error || isDataErasing() || userId !== uid) return;
  const remote: CustomCategory[] = (data ?? []).map((r) => ({
    id: r.id, name: r.name, emoji: r.emoji, color: r.color, keywords: r.keywords ?? [],
  }));
  const remoteIds = new Set(remote.map((c) => c.id));
  const localOnly = store.filter((c) => !remoteIds.has(c.id));
  if (localOnly.length) {
    await supabase.from('custom_categories').upsert(localOnly.map((c) => toRow(c, uid)));
  }
  setStore([...remote, ...localOnly]);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CUSTOM_CATEGORIES_KEY) {
      store = readCustomCategories();
      listeners.forEach((l) => l(store));
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const next = session?.user?.id ?? null;
    if (next === userId) return;
    userId = next;
    if (next) setTimeout(() => { void syncFromCloud(next); }, 0);
  });
}

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>(store);

  useEffect(() => {
    listeners.add(setCategories);
    setCategories(store);
    return () => { listeners.delete(setCategories); };
  }, []);

  const addCategory = useCallback((cat: Omit<CustomCategory, 'id'>): CustomCategory => {
    const created: CustomCategory = { ...cat, emoji: cat.emoji || '🏷️', id: crypto.randomUUID() };
    setStore([...store, created]);
    if (userId) void supabase.from('custom_categories').upsert(toRow(created, userId));
    return created;
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<CustomCategory>) => {
    setStore(store.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const updated = store.find((c) => c.id === id);
    if (userId && updated) void supabase.from('custom_categories').upsert(toRow(updated, userId));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setStore(store.filter((c) => c.id !== id));
    if (userId) void supabase.from('custom_categories').delete().eq('id', id);
  }, []);

  return { categories, addCategory, updateCategory, removeCategory };
}
