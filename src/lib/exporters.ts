import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, CATEGORY_CONFIG, PAYMENT_METHODS } from '@/types/finance';

/**
 * Trigger a browser file download from a Blob.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string | number): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Export transactions to CSV (UTF-8 with BOM for Excel compatibility).
 */
export function exportTransactionsCsv(transactions: Transaction[], currencySymbol = '€') {
  const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'PaymentMethod'];
  const rows = transactions.map(t => [
    t.date.toISOString().slice(0, 10),
    t.type,
    t.amount.toFixed(2),
    currencySymbol,
    CATEGORY_CONFIG[t.category]?.label ?? t.category,
    t.description,
    PAYMENT_METHODS[t.paymentMethod]?.label ?? t.paymentMethod,
  ]);

  const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(',')).join('\r\n');
  // BOM + CSV
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `financeflow-transactions-${stamp}.csv`);
}

/**
 * Build a monthly PDF report with a summary header and detailed transactions table.
 */
export function exportMonthlyReportPdf(
  transactions: Transaction[],
  opts: {
    currencySymbol?: string;
    title?: string;
    income: number;
    expenses: number;
    balance: number;
  }
) {
  const { currencySymbol = '€', title = 'Financial Report', income, expenses, balance } = opts;
  const doc = new jsPDF();
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, 27);

  // Summary
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Income: ${currencySymbol}${income.toFixed(2)}`, 14, 48);
  doc.text(`Expenses: ${currencySymbol}${expenses.toFixed(2)}`, 14, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(`Balance: ${currencySymbol}${balance.toFixed(2)}`, 14, 62);

  // Category breakdown
  const byCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

  const categoryRows = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => [
      CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label ?? cat,
      `${currencySymbol}${amt.toFixed(2)}`,
      expenses > 0 ? `${((amt / expenses) * 100).toFixed(1)}%` : '0%',
    ]);

  if (categoryRows.length > 0) {
    autoTable(doc, {
      startY: 72,
      head: [['Category', 'Amount', '% of Expenses']],
      body: categoryRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9 },
    });
  }

  // Transactions table
  const lastY = (doc as any).lastAutoTable?.finalY ?? 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Transactions', 14, lastY + 12);

  const txRows = transactions
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(t => [
      t.date.toLocaleDateString(),
      t.type === 'income' ? '+' : '-',
      `${currencySymbol}${t.amount.toFixed(2)}`,
      CATEGORY_CONFIG[t.category]?.label ?? t.category,
      t.description.length > 35 ? t.description.slice(0, 32) + '…' : t.description,
    ]);

  autoTable(doc, {
    startY: lastY + 16,
    head: [['Date', 'Type', 'Amount', 'Category', 'Description']],
    body: txRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'right' },
    },
  });

  doc.save(`financeflow-report-${stamp}.pdf`);
}
