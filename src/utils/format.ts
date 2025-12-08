import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatDate = (dateString: string, locale?: string): string => {
  const dateLocale = locale === 'en' ? enUS : vi;
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: dateLocale });
};

export const formatDateTime = (dateString: string, locale?: string): string => {
  const dateLocale = locale === 'en' ? enUS : vi;
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: dateLocale });
};