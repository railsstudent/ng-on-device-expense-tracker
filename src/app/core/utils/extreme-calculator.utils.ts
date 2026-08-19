import { Expense } from '@/shared/interfaces/expense.interface';
import { ExtremeExpense } from '@/shared/interfaces/extreme-expense.interface';
import { AggregationContext } from '@/shared/interfaces/aggregation-context.interface';
import { formatCurrency } from '@/core/utils/math.utils';

/**
 * Standardized helper to format an extreme transaction safely.
 */
export function formatExtremeExpense(e: Expense | null): ExtremeExpense | undefined {
  if (!e) {
    return undefined;
  }
  return {
    merchant: e.merchantName || 'Unknown',
    amount: formatCurrency(e.amount),
    date: e.transactionDate,
    category: e.category || 'other',
  };
}

/**
 * Safe helper to track the highest and lowest transactional extremes.
 */
export function updateExtremes(e: Expense, amount: number, context: AggregationContext): void {
  if (!context.highestTx || amount > context.highestTx.amount) {
    context.highestTx = e;
  }
  if (!context.lowestTx || amount < context.lowestTx.amount) {
    context.lowestTx = e;
  }
}

/**
 * Safely builds transaction extremes.
 */
export function buildExtremes(context: AggregationContext) {
  return {
    highest: formatExtremeExpense(context.highestTx),
    lowest: formatExtremeExpense(context.lowestTx),
  };
}
