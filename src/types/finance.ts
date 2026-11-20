export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'card' | 'paypal' | 'transfer' | 'other';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly' | 'custom';

export type CategoryType = 
  | 'food' 
  | 'groceries'
  | 'restaurant'
  | 'transport' 
  | 'fuel'
  | 'shopping' 
  | 'online_shopping'
  | 'bills' 
  | 'utilities'
  | 'rent'
  | 'entertainment' 
  | 'subscriptions'
  | 'health' 
  | 'pharmacy'
  | 'salary'
  | 'freelance'
  | 'investments'
  | 'travel'
  | 'education'
  | 'gifts'
  | 'insurance'
  | 'other'
  // Custom user-defined categories are stored as `custom:<id>`
  | (string & {});

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryType;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceType;
  customRecurrenceDays?: number;
  isSalary?: boolean;
  isRecurringInstance?: boolean;
  parentTransactionId?: string;
  /** Optional link to a bank account (cloud mode only) */
  bankAccountId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  createdAt: Date;
  deadline?: Date;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
}

export interface FinanceInsight {
  id: string;
  type: 'spending_increase' | 'spending_decrease' | 'category_alert' | 'goal_progress' | 'tip';
  message: string;
  category?: CategoryType;
  percentChange?: number;
  createdAt: Date;
}

// Auto-categorization keywords mapping
export const AUTO_CATEGORIZATION_KEYWORDS: Record<string, { category: CategoryType; type: TransactionType }> = {
  // Shopping
  'amazon': { category: 'online_shopping', type: 'expense' },
  'ebay': { category: 'online_shopping', type: 'expense' },
  'zalando': { category: 'shopping', type: 'expense' },
  'asos': { category: 'shopping', type: 'expense' },
  'ikea': { category: 'shopping', type: 'expense' },
  'mediaworld': { category: 'shopping', type: 'expense' },
  'unieuro': { category: 'shopping', type: 'expense' },
  
  // Food & Restaurants
  'supermercato': { category: 'groceries', type: 'expense' },
  'esselunga': { category: 'groceries', type: 'expense' },
  'coop': { category: 'groceries', type: 'expense' },
  'conad': { category: 'groceries', type: 'expense' },
  'lidl': { category: 'groceries', type: 'expense' },
  'carrefour': { category: 'groceries', type: 'expense' },
  'eurospin': { category: 'groceries', type: 'expense' },
  'spesa': { category: 'groceries', type: 'expense' },
  'ristorante': { category: 'restaurant', type: 'expense' },
  'pizzeria': { category: 'restaurant', type: 'expense' },
  'mcdonald': { category: 'restaurant', type: 'expense' },
  'burger king': { category: 'restaurant', type: 'expense' },
  'deliveroo': { category: 'restaurant', type: 'expense' },
  'glovo': { category: 'restaurant', type: 'expense' },
  'just eat': { category: 'restaurant', type: 'expense' },
  'uber eats': { category: 'restaurant', type: 'expense' },
  
  // Transport
  'benzina': { category: 'fuel', type: 'expense' },
  'carburante': { category: 'fuel', type: 'expense' },
  'eni': { category: 'fuel', type: 'expense' },
  'q8': { category: 'fuel', type: 'expense' },
  'ip': { category: 'fuel', type: 'expense' },
  'autostrada': { category: 'transport', type: 'expense' },
  'telepass': { category: 'transport', type: 'expense' },
  'treno': { category: 'transport', type: 'expense' },
  'trenitalia': { category: 'transport', type: 'expense' },
  'italo': { category: 'transport', type: 'expense' },
  'metro': { category: 'transport', type: 'expense' },
  'autobus': { category: 'transport', type: 'expense' },
  'atm': { category: 'transport', type: 'expense' },
  'uber': { category: 'transport', type: 'expense' },
  'taxi': { category: 'transport', type: 'expense' },
  
  // Bills & Utilities
  'bolletta': { category: 'utilities', type: 'expense' },
  'enel': { category: 'utilities', type: 'expense' },
  'eni gas': { category: 'utilities', type: 'expense' },
  'a2a': { category: 'utilities', type: 'expense' },
  'acqua': { category: 'utilities', type: 'expense' },
  'luce': { category: 'utilities', type: 'expense' },
  'gas': { category: 'utilities', type: 'expense' },
  'affitto': { category: 'rent', type: 'expense' },
  'canone': { category: 'rent', type: 'expense' },
  'telefono': { category: 'bills', type: 'expense' },
  'tim': { category: 'bills', type: 'expense' },
  'vodafone': { category: 'bills', type: 'expense' },
  'wind': { category: 'bills', type: 'expense' },
  'iliad': { category: 'bills', type: 'expense' },
  'internet': { category: 'bills', type: 'expense' },
  'fastweb': { category: 'bills', type: 'expense' },
  
  // Subscriptions
  'netflix': { category: 'subscriptions', type: 'expense' },
  'spotify': { category: 'subscriptions', type: 'expense' },
  'disney+': { category: 'subscriptions', type: 'expense' },
  'prime video': { category: 'subscriptions', type: 'expense' },
  'amazon prime': { category: 'subscriptions', type: 'expense' },
  'youtube premium': { category: 'subscriptions', type: 'expense' },
  'dazn': { category: 'subscriptions', type: 'expense' },
  'sky': { category: 'subscriptions', type: 'expense' },
  'apple music': { category: 'subscriptions', type: 'expense' },
  'playstation plus': { category: 'subscriptions', type: 'expense' },
  'xbox game pass': { category: 'subscriptions', type: 'expense' },
  'palestra': { category: 'subscriptions', type: 'expense' },
  'gym': { category: 'subscriptions', type: 'expense' },
  
  // Health
  'farmacia': { category: 'pharmacy', type: 'expense' },
  'medicina': { category: 'pharmacy', type: 'expense' },
  'dottore': { category: 'health', type: 'expense' },
  'medico': { category: 'health', type: 'expense' },
  'ospedale': { category: 'health', type: 'expense' },
  'visita': { category: 'health', type: 'expense' },
  'dentista': { category: 'health', type: 'expense' },
  
  // Income
  'stipendio': { category: 'salary', type: 'income' },
  'busta paga': { category: 'salary', type: 'income' },
  'salario': { category: 'salary', type: 'income' },
  'freelance': { category: 'freelance', type: 'income' },
  'consulenza': { category: 'freelance', type: 'income' },
  'dividendi': { category: 'investments', type: 'income' },
  'interessi': { category: 'investments', type: 'income' },
  
  // Travel
  'hotel': { category: 'travel', type: 'expense' },
  'booking': { category: 'travel', type: 'expense' },
  'airbnb': { category: 'travel', type: 'expense' },
  'volo': { category: 'travel', type: 'expense' },
  'ryanair': { category: 'travel', type: 'expense' },
  'easyjet': { category: 'travel', type: 'expense' },
  'alitalia': { category: 'travel', type: 'expense' },
  'vacanza': { category: 'travel', type: 'expense' },
  
  // Education
  'università': { category: 'education', type: 'expense' },
  'corso': { category: 'education', type: 'expense' },
  'libri': { category: 'education', type: 'expense' },
  'udemy': { category: 'education', type: 'expense' },
  'masterclass': { category: 'education', type: 'expense' },
  
  // Insurance
  'assicurazione': { category: 'insurance', type: 'expense' },
  'polizza': { category: 'insurance', type: 'expense' },
  'rc auto': { category: 'insurance', type: 'expense' },
  
  // Gifts
  'regalo': { category: 'gifts', type: 'expense' },
  'compleanno': { category: 'gifts', type: 'expense' },
  'natale': { category: 'gifts', type: 'expense' },
};

export const CATEGORY_CONFIG: Record<CategoryType, { label: string; emoji: string; color: string }> = {
  food: { label: 'Cibo', emoji: '🍕', color: 'category-food' },
  groceries: { label: 'Spesa', emoji: '🛒', color: 'category-groceries' },
  restaurant: { label: 'Ristorante', emoji: '🍽️', color: 'category-restaurant' },
  transport: { label: 'Trasporti', emoji: '🚗', color: 'category-transport' },
  fuel: { label: 'Carburante', emoji: '⛽', color: 'category-fuel' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: 'category-shopping' },
  online_shopping: { label: 'Shopping Online', emoji: '📦', color: 'category-online-shopping' },
  bills: { label: 'Bollette', emoji: '📄', color: 'category-bills' },
  utilities: { label: 'Utenze', emoji: '💡', color: 'category-utilities' },
  rent: { label: 'Affitto', emoji: '🏠', color: 'category-rent' },
  entertainment: { label: 'Divertimento', emoji: '🎮', color: 'category-entertainment' },
  subscriptions: { label: 'Abbonamenti', emoji: '📱', color: 'category-subscriptions' },
  health: { label: 'Salute', emoji: '💊', color: 'category-health' },
  pharmacy: { label: 'Farmacia', emoji: '💉', color: 'category-pharmacy' },
  salary: { label: 'Stipendio', emoji: '💰', color: 'income' },
  freelance: { label: 'Freelance', emoji: '💼', color: 'freelance' },
  investments: { label: 'Investimenti', emoji: '📈', color: 'investments' },
  travel: { label: 'Viaggi', emoji: '✈️', color: 'category-travel' },
  education: { label: 'Istruzione', emoji: '📚', color: 'category-education' },
  gifts: { label: 'Regali', emoji: '🎁', color: 'category-gifts' },
  insurance: { label: 'Assicurazioni', emoji: '🛡️', color: 'category-insurance' },
  other: { label: 'Altro', emoji: '📦', color: 'category-other' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; emoji: string }> = {
  cash: { label: 'Contanti', emoji: '💵' },
  card: { label: 'Carta', emoji: '💳' },
  paypal: { label: 'PayPal', emoji: '🅿️' },
  transfer: { label: 'Bonifico', emoji: '🏦' },
  other: { label: 'Altro', emoji: '💱' },
};

export const RECURRENCE_CONFIG: Record<RecurrenceType, { label: string; days: number }> = {
  none: { label: 'Una tantum', days: 0 },
  daily: { label: 'Giornaliera', days: 1 },
  weekly: { label: 'Settimanale', days: 7 },
  biweekly: { label: 'Bisettimanale', days: 14 },
  monthly: { label: 'Mensile', days: 30 },
  quarterly: { label: 'Trimestrale', days: 90 },
  biannual: { label: 'Semestrale', days: 180 },
  yearly: { label: 'Annuale', days: 365 },
  custom: { label: 'Personalizzata', days: 0 },
};

// Additional vocabulary in each supported language. Specific phrases outrank merchants.
const CATEGORY_VOCABULARY: Partial<Record<CategoryType, string[]>> = {
  salary: ['salary', 'payroll', 'paycheck', 'wage', 'sueldo', 'nómina', 'salaire', 'paie', 'gehalt', 'lohn', 'pensione', 'pension', 'tredicesima', 'quattordicesima', 'bonus stipendio'],
  freelance: ['compenso', 'parcella', 'prestazione professionale', 'lavoro freelance', 'fattura cliente', 'commissione progetto', 'consulting', 'client invoice', 'honorarios', 'consultoría', 'honoraires', 'beratung', 'honorar'],
  investments: ['dividendo', 'dividend', 'dividends', 'dividendos', 'dividendes', 'dividenden', 'interessi bancari', 'interest', 'intereses', 'intérêts', 'zinsen', 'cedola', 'cedole', 'capital gain', 'rendimenti', 'investimento', 'investimenti', 'investment', 'investments', 'etf', 'azioni'],
  groceries: ['spesa alimentare', 'alimentari', 'supermarket', 'groceries', 'grocery', 'supermercado', 'supermarché', 'supermarkt', 'aldi', 'rewe', 'edeka', 'tesco', 'mercadona', 'auchan', 'penny', 'despar', 'pam', 'frutta', 'verdura', 'latte', 'pane'],
  restaurant: ['pizza', 'sushi', 'pranzo', 'cena', 'colazione', 'bar', 'caffè', 'restaurant', 'dinner', 'lunch', 'coffee', 'restaurante', 'cena restaurante', 'café', 'déjeuner', 'dîner', 'essen gehen', 'kaffee'],
  fuel: ['diesel', 'gasolio', 'rifornimento', 'petrol', 'gasoline', 'fuel', 'gasolina', 'carburant', 'essence', 'benzin', 'tanken'],
  transport: ['parcheggio', 'bus', 'tram', 'biglietto treno', 'parking', 'train', 'transporte', 'tren', 'péage', 'zug', 'bahn', 'flixbus'],
  subscriptions: ['abbonamento', 'subscription', 'suscripción', 'abonnement', 'mitgliedschaft', 'apple tv', 'icloud', 'google one'],
  utilities: ['bolletta gas', 'bolletta luce', 'bolletta acqua', 'gas bill', 'electricity', 'water bill', 'electricidad', 'facture électricité', 'strom', 'gasrechnung'],
  rent: ['rent', 'alquiler', 'loyer', 'miete', 'canone affitto'],
  bills: ['phone bill', 'factura teléfono', 'facture téléphone', 'telefonrechnung'],
  pharmacy: ['farmaco', 'farmaci', 'parafarmacia', 'pharmacy', 'medicine', 'farmacia', 'pharmacie', 'apotheke', 'medikamente'],
  health: ['visita medica', 'analisi sangue', 'fisioterapia', 'psicologo', 'doctor', 'dentist', 'hospital', 'médico', 'médecin', 'arzt', 'zahnarzt'],
  shopping: ['vestiti', 'scarpe', 'abbigliamento', 'zara', 'h&m', 'clothes', 'shoes', 'ropa', 'vêtements', 'kleidung'],
  online_shopping: ['temu', 'shein', 'aliexpress', 'online shopping'],
  entertainment: ['cinema', 'concerto', 'teatro', 'videogioco', 'movie', 'concert', 'cine', 'théâtre', 'kino', 'konzert'],
  travel: ['vacanze', 'aereo', 'flight', 'holiday', 'viaje', 'vuelo', 'voyage', 'avion', 'urlaub', 'flug'],
  education: ['universita', 'scuola', 'school', 'tuition', 'course', 'curso', 'escuela', 'école', 'cours', 'schule', 'studium'],
  insurance: ['insurance', 'seguro', 'assurance', 'versicherung'],
  gifts: ['gift', 'present', 'regali', 'regalo ricevuto', 'regalo compleanno', 'regalo ricevuto compleanno', 'cadeau', 'geschenk'],
  other: ['rimborso', 'refund', 'reimbursement', 'reembolso', 'remboursement', 'erstattung', 'vendita', 'vendite', 'vinted', 'resale', 'sale proceeds', 'venta', 'vente', 'verkauf', 'cashback', 'bonifico ricevuto', 'trasferimento ricevuto'],
};

const INCOME_CATEGORIES = new Set<CategoryType>(['salary', 'freelance', 'investments', 'other']);

function normalizeCategoryText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

/** Match whole words/phrases, respect the selected direction, and prefer specific evidence. */
export function autoCategorizeTransaction(
  description: string,
  selectedType?: TransactionType,
  customCategories: CustomCategory[] = [],
): { category: CategoryType; type: TransactionType } | null {
  const text = ` ${normalizeCategoryText(description)} `;
  if (!text.trim()) return null;
  const candidates: { category: CategoryType; type: TransactionType; score: number }[] = [];
  const add = (keyword: string, category: CategoryType, type: TransactionType, custom = false) => {
    if (selectedType && type !== selectedType) return;
    const normalized = normalizeCategoryText(keyword);
    if (!normalized || !text.includes(` ${normalized} `)) return;
    candidates.push({ category, type, score: normalized.split(' ').length * 100 + normalized.length + (custom ? 1000 : 0) });
  };
  for (const [keyword, result] of Object.entries(AUTO_CATEGORIZATION_KEYWORDS)) {
    add(keyword, result.category, result.type);
  }
  for (const [category, keywords] of Object.entries(CATEGORY_VOCABULARY)) {
    const type = INCOME_CATEGORIES.has(category) ? 'income' : 'expense';
    for (const keyword of keywords) add(keyword, category, type);
  }
  for (const custom of customCategories) {
    for (const keyword of custom.keywords) add(keyword, `custom:${custom.id}`, selectedType ?? 'expense', true);
  }
  // A refund or resale is income, not a purchase at the mentioned merchant.
  if (selectedType === 'income' || !selectedType) {
    const otherIncome = candidates.find(candidate => candidate.category === 'other' && candidate.type === 'income');
    if (otherIncome) return { category: 'other', type: 'income' };
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return null;
  const tied = candidates.find(candidate => candidate.score === best.score && candidate.category !== best.category);
  return tied ? null : { category: best.category, type: best.type };
}

// ===== Custom categories =====
export const CUSTOM_CATEGORIES_KEY = 'finance_custom_categories';

export function readCustomCategories(): CustomCategory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as CustomCategory[]) : [];
  } catch {
    return [];
  }
}

export interface CategoryMeta { label: string; emoji: string; color: string }

/** Resolves a category key (built-in or `custom:<id>`) to display metadata. */
export function resolveCategoryMeta(key: string, customs?: CustomCategory[]): CategoryMeta {
  if (key?.startsWith('custom:')) {
    const id = key.slice(7);
    const list = customs ?? readCustomCategories();
    const found = list.find((c) => c.id === id);
    if (found) return { label: found.name, emoji: found.emoji, color: 'category-other' };
    return { label: key, emoji: '🏷️', color: 'category-other' };
  }
  return (
    (CATEGORY_CONFIG as Record<string, CategoryMeta>)[key] ?? {
      label: key,
      emoji: '📦',
      color: 'category-other',
    }
  );
}
