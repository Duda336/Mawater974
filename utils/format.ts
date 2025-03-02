export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ar-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
