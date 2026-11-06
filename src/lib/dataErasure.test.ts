import { describe, it, expect } from 'bun:test';
import { beginDataErasure, cancelDataErasure, clearAppData, dataGeneration, isDataErasing } from './dataErasure';

describe('data erasure', () => {
  it('removes financial data and backups but preserves login and language', () => {
    const storage = {
      finance_cache: 'private', finance_data_backup: 'private', finance_settings: 'private',
      finance_custom_categories: 'private', finance_guest_mode: 'true', finance_language: 'it',
      'sb-auth-token': 'session',
      removeItem(key: string) { delete (this as Record<string, unknown>)[key]; },
      setItem(key: string, value: string) { (this as Record<string, unknown>)[key] = value; },
    };
    clearAppData(storage as unknown as Storage);
    expect(storage.finance_cache).toBeUndefined();
    expect(storage.finance_data_backup).toBeUndefined();
    expect(storage.finance_settings).toBeUndefined();
    expect(storage.finance_custom_categories).toBeUndefined();
    expect(storage['sb-auth-token']).toBe('session');
    expect(storage.finance_language).toBe('it');
    expect(JSON.parse((storage as unknown as Record<string, string>).finance_data).transactions).toEqual([]);
  });
  it('invalidates in-flight reads and blocks saves until a failed deletion is cancelled', () => {
    const before = dataGeneration();
    beginDataErasure();
    expect(isDataErasing()).toBe(true);
    expect(dataGeneration()).not.toBe(before);
    cancelDataErasure();
    expect(isDataErasing()).toBe(false);
  });
});