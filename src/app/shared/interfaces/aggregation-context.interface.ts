import { Expense, CanonicalExpenseCategory } from './expense.interface';

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

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
  dailyTotals: Record<string, number>;
}
