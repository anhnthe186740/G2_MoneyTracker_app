/**
 * Convert date from YYYY-MM-DD to DD/MM/YYYY
 */
export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Convert date from DD/MM/YYYY to YYYY-MM-DD
 */
export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr; // Already in YYYY-MM-DD format
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate next date based on frequency
 */
export const calculateNextDate = (
  startDate: string,
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
): string => {
  const date = new Date(startDate);
  
  switch (frequency) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
};
