import { autoCategorizeTransaction, CategoryType, PaymentMethod } from '@/types/finance';

export interface ParsedRow {
  date: Date;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category: CategoryType;
  paymentMethod: PaymentMethod;
}

/**
 * Smart CSV/Excel parser that auto-detects column structure.
 * Supports common Italian bank exports (Intesa, Unicredit, Revolut, BPER, etc.).
 */
export function parseBankCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  // Auto-detect delimiter
  const firstLine = text.split('\n')[0] || '';
  const delim = [';', ',', '\t', '|']
    .map(d => ({ d, n: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length }))
    .sort((a, b) => b.n - a.n)[0].d;

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    errors.push('CSV vuoto o senza righe dati');
    return { rows, errors };
  }

  const splitLine = (line: string): string[] => {
    // Basic CSV parser handling quoted values
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delim && !inQuotes) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const header = splitLine(lines[0]).map(h => h.toLowerCase());
  const findCol = (...candidates: string[]) =>
    header.findIndex(h => candidates.some(c => h.includes(c)));

  const dateIdx = findCol('data', 'date', 'datum');
  const descIdx = findCol('descri', 'causale', 'description', 'memo', 'narrative');
  const amountIdx = findCol('importo', 'amount', 'value', 'valore');
  const debitIdx = findCol('dare', 'debit', 'uscit');
  const creditIdx = findCol('avere', 'credit', 'entrat');

  if (dateIdx < 0 || (amountIdx < 0 && (debitIdx < 0 || creditIdx < 0))) {
    errors.push('Impossibile rilevare colonne. Servono almeno: data + importo (o dare/avere).');
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = splitLine(lines[i]);
      const rawDate = cols[dateIdx] || '';
      const date = parseDate(rawDate);
      if (!date) continue;

      let amount = 0;
      let type: 'income' | 'expense' = 'expense';

      if (amountIdx >= 0) {
        amount = parseAmount(cols[amountIdx]);
        type = amount >= 0 ? 'income' : 'expense';
        amount = Math.abs(amount);
      } else {
        const debit = parseAmount(cols[debitIdx] || '');
        const credit = parseAmount(cols[creditIdx] || '');
        if (credit > 0) { amount = credit; type = 'income'; }
        else if (debit > 0) { amount = debit; type = 'expense'; }
        else continue;
      }

      if (amount === 0) continue;

      const description = (cols[descIdx] || 'Importato').trim() || 'Importato';
      const auto = autoCategorizeTransaction(description);

      rows.push({
        date,
        amount,
        description,
        type: auto?.type || type,
        category: auto?.category || (type === 'income' ? 'salary' : 'other'),
        paymentMethod: 'card',
      });
    } catch (e) {
      errors.push(`Riga ${i + 1}: parse error`);
    }
  }

  return { rows, errors };
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  // Handle EU format "1.234,56" or US "1,234.56"
  let s = raw.replace(/\s/g, '').replace(/€|\$|£/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    // The last separator is the decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // Try ISO first
  const iso = new Date(raw);
  if (!isNaN(iso.getTime()) && raw.includes('-')) return iso;
  // dd/mm/yyyy or dd-mm-yyyy
  const m = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (m) {
    const d = parseInt(m[1]);
    const mo = parseInt(m[2]) - 1;
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

export async function hashFile(content: string): Promise<string> {
  const buf = new TextEncoder().encode(content);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
