import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd/MM/yyyy');
};