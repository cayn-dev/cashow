// Pause persistence before erasing data so late saves cannot restore it.
let erasing = false;
let generation = 0;
export const isDataErasing = () => erasing;
export const dataGeneration = () => generation;
export function beginDataErasure() { erasing = true; generation += 1; }
export function cancelDataErasure() { erasing = false; generation += 1; }
export function clearAppData(storage: Storage = localStorage) {
  for (const key of Object.keys(storage)) {
    if (key.startsWith('finance_') && key !== 'finance_guest_mode' && key !== 'finance_language') {
      storage.removeItem(key);
    }
  }
  // An explicit empty state prevents demo data or a backup from returning.
  storage.setItem('finance_initialized', 'true');
  storage.setItem('finance_data', JSON.stringify({ transactions: [], savingsGoals: [], monthlySalary: 0, version: 2 }));
}