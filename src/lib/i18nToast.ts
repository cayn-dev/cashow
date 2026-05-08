import { translations, Language } from '@/i18n/translations';

export function tt(key: string, params?: Record<string, string | number>): string {
  const lang = ((typeof window !== 'undefined' && localStorage.getItem('finance_language')) || 'it') as Language;
  let text = translations[lang]?.[key] || translations['it']?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
