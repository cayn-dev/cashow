// Salary frequency + Italian gross→net estimation helpers.

export type SalaryFrequency = 'weekly' | 'monthly' | 'yearly';

export const WEEKS_PER_MONTH = 4.33;

/** Convert an amount expressed in `frequency` into its monthly equivalent. */
export function toMonthly(amount: number, frequency: SalaryFrequency): number {
  if (!amount || amount < 0) return 0;
  switch (frequency) {
    case 'weekly':
      return amount * WEEKS_PER_MONTH;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

/** Convert a monthly amount back into the given frequency base. */
export function fromMonthly(monthly: number, frequency: SalaryFrequency): number {
  if (!monthly || monthly < 0) return 0;
  switch (frequency) {
    case 'weekly':
      return monthly / WEEKS_PER_MONTH;
    case 'yearly':
      return monthly * 12;
    default:
      return monthly;
  }
}

/** Convert an amount from one frequency base to another. */
export function convertFrequency(
  amount: number,
  from: SalaryFrequency,
  to: SalaryFrequency,
): number {
  return fromMonthly(toMonthly(amount, from), to);
}

// ---- Italian gross → net estimate (dipendente, indicative only) ----

const INPS_RATE = 0.0919; // employee social contributions (standard)

// IRPEF brackets 2024/2025 (3 scaglioni)
const IRPEF_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 28000, rate: 0.23 },
  { upTo: 50000, rate: 0.35 },
  { upTo: Infinity, rate: 0.43 },
];

function irpef(taxable: number): number {
  let tax = 0;
  let prev = 0;
  for (const b of IRPEF_BRACKETS) {
    if (taxable <= prev) break;
    const slice = Math.min(taxable, b.upTo) - prev;
    tax += slice * b.rate;
    prev = b.upTo;
  }
  return Math.max(0, tax);
}

/** Employee tax credit (detrazione lavoro dipendente), simplified 2024 rules. */
function employeeDeduction(taxable: number): number {
  if (taxable <= 15000) return 1955;
  if (taxable <= 28000) return 1910 + 1190 * ((28000 - taxable) / 13000);
  if (taxable <= 50000) return 1910 * ((50000 - taxable) / 22000);
  return 0;
}

/** Regional + municipal surcharges, averaged estimate. */
const ADDIZIONALI_RATE = 0.019;

/**
 * Estimate the yearly NET salary from a yearly GROSS salary using standard
 * Italian employee rates. Indicative only.
 */
export function grossToNetYearly(gross: number): number {
  if (!gross || gross <= 0) return 0;
  const contributions = gross * INPS_RATE;
  const taxable = gross - contributions;
  const tax = Math.max(0, irpef(taxable) - employeeDeduction(taxable));
  const surcharges = taxable * ADDIZIONALI_RATE;
  return Math.max(0, taxable - tax - surcharges);
}

/**
 * Estimate the NET amount for an amount expressed in the given frequency.
 * The conversion is always computed on the annualised value for accuracy.
 */
export function grossToNet(amount: number, frequency: SalaryFrequency): number {
  const yearlyGross = toMonthly(amount, frequency) * 12;
  const yearlyNet = grossToNetYearly(yearlyGross);
  return fromMonthly(yearlyNet / 12, frequency);
}

/**
 * Net monthly salary used everywhere in the app as calculation base.
 */
export function netMonthlySalary(
  amount: number,
  frequency: SalaryFrequency,
  isGross: boolean,
): number {
  const monthly = toMonthly(amount, frequency);
  if (!isGross || frequency === 'weekly') return monthly;
  return grossToNetYearly(monthly * 12) / 12;
}
