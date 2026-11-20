import { describe, expect, test } from 'bun:test';
import { autoCategorizeTransaction } from './finance';
import { parseBankCSV } from '../lib/csvImporter';

describe('transaction categorization', () => {
  test('income never becomes an expense because a merchant is mentioned', () => {
    expect(autoCategorizeTransaction('Amazon', 'income')).toBeNull();
    expect(autoCategorizeTransaction('Rimborso Amazon', 'income')).toEqual({ category: 'other', type: 'income' });
    expect(autoCategorizeTransaction('Vendita su Vinted', 'income')).toEqual({ category: 'other', type: 'income' });
  });
  test('recognizes salaries and professional income', () => {
    expect(autoCategorizeTransaction('Stipendio novembre', 'income')?.category).toBe('salary');
    expect(autoCategorizeTransaction('Compenso consulenza', 'income')?.category).toBe('freelance');
    expect(autoCategorizeTransaction('Dividendi ETF', 'income')?.category).toBe('investments');
  });
  test('matches whole words instead of short fragments inside unrelated words', () => {
    expect(autoCategorizeTransaction('Cinema', 'expense')?.category).toBe('entertainment');
    expect(autoCategorizeTransaction('Riparazione', 'expense')).toBeNull();
    expect(autoCategorizeTransaction('Beneficenza', 'expense')).toBeNull();
  });
  test('specific phrases beat generic merchant names', () => {
    expect(autoCategorizeTransaction('Amazon Prime', 'expense')?.category).toBe('subscriptions');
    expect(autoCategorizeTransaction('Uber Eats', 'expense')?.category).toBe('restaurant');
    expect(autoCategorizeTransaction('Eni gas', 'expense')?.category).toBe('utilities');
  });
  test('recomputes suggestions as a description changes or clears', () => {
    expect(autoCategorizeTransaction('Amazon', 'expense')?.category).toBe('online_shopping');
    expect(autoCategorizeTransaction('Amazon Prime', 'expense')?.category).toBe('subscriptions');
    expect(autoCategorizeTransaction('', 'expense')).toBeNull();
  });
  test('supports all five languages and accents', () => {
    for (const description of ['Stipendio', 'Salary', 'NÓMINA', 'Salaire', 'Gehalt']) {
      expect(autoCategorizeTransaction(description, 'income')?.category).toBe('salary');
    }
    for (const description of ['Università', 'School', 'Escuela', 'École', 'Schule']) {
      expect(autoCategorizeTransaction(description, 'expense')?.category).toBe('education');
    }
  });
  test('custom keywords override built-in suggestions and retain direction', () => {
    const customs = [{ id: 'work', name: 'Work', emoji: '💼', color: 'other', keywords: ['Amazon'] }];
    expect(autoCategorizeTransaction('Amazon', 'expense', customs)).toEqual({ category: 'custom:work', type: 'expense' });
  });
  test('CSV categorization preserves financial direction and does not guess salary', () => {
    const { rows } = parseBankCSV('data;descrizione;importo\n20/11/2026;Rimborso Amazon;25\n20/11/2026;Stipendio;-30\n20/11/2026;Bonifico;10');
    expect(rows.map(row => [row.type, row.category])).toEqual([['income', 'other'], ['expense', 'other'], ['income', 'other']]);
  });
});