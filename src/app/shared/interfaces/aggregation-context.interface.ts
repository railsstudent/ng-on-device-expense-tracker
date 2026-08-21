import { Expense, CanonicalExpenseCategory } from './expense.interface';
import { CategoryMetrics } from './category-metrics.interface';

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

/**
 * Represents a date string formatted as YYYY-MM-DD.
 */
export type DateKey = string;

export interface DailyTrendEntry {
  totalSpending: number;
  transactionCount: number;
  categoryBreakdown: Partial<Record<CanonicalExpenseCategory, CategoryMetrics>>;
}

export interface AggregationContext {
  totalSpending: number;
  categoryTotals: Partial<Record<CanonicalExpenseCategory, number>>;
  categoryCounts: Partial<Record<CanonicalExpenseCategory, number>>;
  merchantTotals: Record<string, number>;
  merchantCounts: Record<string, number>;
  monthlyTotals: Record<string, number>;
  dayOfWeekSpending: Partial<Record<DayOfWeek, number>>;
  highestTx: Expense | null;
  lowestTx: Expense | null;
  dailyTrends: Record<DateKey, DailyTrendEntry>;
}

/**
 * Creates an empty/default aggregation context structure.
 */
export function createInitialContext(): AggregationContext {
  return {
    totalSpending: 0,
    categoryTotals: {},
    categoryCounts: {},
    merchantTotals: {},
    merchantCounts: {},
    monthlyTotals: {},
    dayOfWeekSpending: {},
    highestTx: null,
    lowestTx: null,
    dailyTrends: {},
  };
}
