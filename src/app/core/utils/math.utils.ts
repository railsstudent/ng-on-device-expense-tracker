/**
 * Formats a numeric currency value safely to 2 decimal places as a type-safe number.
 */
export const formatCurrency = (val: number): number => Number(val.toFixed(2));

/**
 * Calculates part's percentage of total safely, returning 0 if total is 0.
 */
export const calculatePercentage = (part: number, total: number): number =>
  total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0;
