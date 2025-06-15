import i18n from '../i18n';

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const lang = i18n.language || 'en';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang, options).format(d);
}

export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  const lang = i18n.language || 'en';
  return new Intl.NumberFormat(lang, options).format(num);
} 