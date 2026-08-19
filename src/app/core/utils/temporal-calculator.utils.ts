import { calculatePercentage, formatCurrency } from '@/core/utils/math.utils';
import {
  AggregationContext,
  DailyTrendEntry,
  DateKey,
  DayOfWeek,
} from '@/shared/interfaces/aggregation-context.interface';
import { CategoryMetrics } from '@/shared/interfaces/category-metrics.interface';
import { CanonicalExpenseCategory } from '@/shared/interfaces/expense.interface';

const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Standardizes and rounds monthly totals.
 */
function serializeMonthlyTotals(monthlyTotals: Record<string, number>): Record<string, number> {
  const monthlySpending: Record<string, number> = {};
  const monthKeys = Object.keys(monthlyTotals);
  for (const key of monthKeys) {
    monthlySpending[key] = formatCurrency(monthlyTotals[key]);
  }
  return monthlySpending;
}

interface DailyCategoryTrend {
  totalSpending: number;
  percentageOfTotal: number;
  transactionCount: number;
}

/**
 * Serializes specific daily category spending percentages.
 */
function serializeDailyCategoryTotals(
  categoryTotals: Partial<Record<CanonicalExpenseCategory, CategoryMetrics>>,
  dayTotal: number,
): Record<string, DailyCategoryTrend> {
  const serialized: Record<string, DailyCategoryTrend> = {};
  const categories = Object.keys(categoryTotals) as CanonicalExpenseCategory[];
  for (const category of categories) {
    const accum = categoryTotals[category];
    if (accum !== undefined) {
      serialized[category] = {
        totalSpending: formatCurrency(accum.totalSpending),
        percentageOfTotal: calculatePercentage(accum.totalSpending, dayTotal),
        transactionCount: accum.transactionCount,
      };
    }
  }
  return serialized;
}

/**
 * Safely serializes daily trend entries with percentage distributions.
 */
function serializeDailyTrends(
  dailyTrends: Record<DateKey, DailyTrendEntry>,
): Record<DateKey, { totalSpending: number; categoryBreakdown: Record<string, DailyCategoryTrend> }> {
  const serialized: Record<DateKey, { totalSpending: number; categoryBreakdown: Record<string, DailyCategoryTrend> }> =
    {};
  const trendKeys = Object.keys(dailyTrends);
  for (const key of trendKeys) {
    const trend = dailyTrends[key];
    serialized[key] = {
      totalSpending: formatCurrency(trend.totalSpending),
      categoryBreakdown: serializeDailyCategoryTotals(trend.categoryBreakdown, trend.totalSpending),
    };
  }
  return serialized;
}

/**
 * Identifies the day of the week with the maximum accumulated spending.
 */
function getPeakSpendingDayOfWeek(dayOfWeekSpending: Partial<Record<DayOfWeek, number>>): DayOfWeek | 'None' {
  let peakDay: DayOfWeek | 'None' = 'None';
  let maxSpending = 0;
  for (const day of DAYS_OF_WEEK) {
    const spending = dayOfWeekSpending[day] || 0;
    if (spending > maxSpending) {
      maxSpending = spending;
      peakDay = day;
    }
  }
  return peakDay;
}

/**
 * Builds overall temporal trends and daily-distribution metrics.
 */
export function buildTemporalTrends(context: AggregationContext) {
  return {
    monthlySpending: serializeMonthlyTotals(context.monthlyTotals),
    dailyTrends: serializeDailyTrends(context.dailyTrends),
    peakSpendingDayOfWeek: getPeakSpendingDayOfWeek(context.dayOfWeekSpending),
  };
}
