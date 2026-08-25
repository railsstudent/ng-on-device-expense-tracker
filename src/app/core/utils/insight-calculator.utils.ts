import { calculatePercentage, formatCurrency } from '@/core/utils/math.utils';
import {
  AggregationContext,
  DailyTrendEntry,
  DayOfWeek,
  createInitialContext,
} from '@/shared/interfaces/aggregation-context.interface';
import { CategoryMetrics } from '@/shared/interfaces/category-metrics.interface';
import { CanonicalExpenseCategory, Expense } from '@/shared/interfaces/expense.interface';
import { buildExtremes, updateExtremes } from './extreme-calculator.utils';
import { buildMostFrequentMerchants, buildTopMerchants } from './merchant-calculator.utils';
import { buildTemporalTrends } from './temporal-calculator.utils';

const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Updates temporal stats safely for a given expense and amount.
 */
function updateTemporalStats(e: Expense, amount: number, context: AggregationContext): void {
  if (e.transactionDate && /^\d{4}-\d{2}/.test(e.transactionDate)) {
    const dateVal = new Date(e.transactionDate);
    if (!isNaN(dateVal.getTime())) {
      // Monthly
      const monthStr = e.transactionDate.substring(0, 7);
      context.monthlyTotals[monthStr] = (context.monthlyTotals[monthStr] || 0) + amount;

      // Day of Week
      const dayIndex = dateVal.getDay();
      if (!isNaN(dayIndex)) {
        const dayName = DAYS_OF_WEEK[dayIndex];
        context.dayOfWeekSpending[dayName] = (context.dayOfWeekSpending[dayName] || 0) + amount;
      }
    }
  }
}

/**
 * Safe helper to accumulate daily trends and category metrics.
 */
function updateDailyTrends(
  e: Expense,
  amount: number,
  cat: CanonicalExpenseCategory,
  dailyTrends: Record<string, DailyTrendEntry>,
): void {
  if (e.transactionDate) {
    if (!dailyTrends[e.transactionDate]) {
      dailyTrends[e.transactionDate] = {
        totalSpending: 0,
        transactionCount: 0,
        categoryBreakdown: {},
      };
    }

    const trend = dailyTrends[e.transactionDate];
    trend.totalSpending = trend.totalSpending + amount;
    trend.transactionCount = trend.transactionCount + 1;

    if (!trend.categoryBreakdown[cat]) {
      trend.categoryBreakdown[cat] = {
        totalSpending: 0,
        percentageOfTotal: 0,
        transactionCount: 0,
      };
    }

    const catAccum = trend.categoryBreakdown[cat]!;
    catAccum.totalSpending = catAccum.totalSpending + amount;
    catAccum.transactionCount = catAccum.transactionCount + 1;
  }
}

/**
 * Safely aggregates totals and transaction counts for a specific key.
 */
function accumulateMetrics(
  totals: Partial<Record<string, number>>,
  counts: Partial<Record<string, number>>,
  key: string,
  amount: number,
): void {
  totals[key] = (totals[key] || 0) + amount;
  counts[key] = (counts[key] || 0) + 1;
}

/**
 * Aggregates raw transactional data in a single clean pass.
 */
function aggregateExpenseData(expenses: Expense[]): AggregationContext {
  const context = createInitialContext();

  for (const e of expenses) {
    const amount = e.amount;
    context.totalSpending = context.totalSpending + amount;

    // Categories
    const cat = e.category || 'other';
    accumulateMetrics(context.categoryTotals, context.categoryCounts, cat, amount);

    // Merchants
    const merchant = e.merchantName || 'Unknown';
    accumulateMetrics(context.merchantTotals, context.merchantCounts, merchant, amount);

    // Temporal Metrics (Monthly and Day of Week)
    updateTemporalStats(e, amount, context);

    // Daily trends (grouped by date)
    updateDailyTrends(e, amount, cat, context.dailyTrends);

    // Extremes (Max/Min)
    updateExtremes(e, amount, context);
  }

  return context;
}

/**
 * Builds overall summary statistics.
 */
function buildSummary(expenses: Expense[], context: AggregationContext, sortedCategories: CanonicalExpenseCategory[]) {
  const avg = expenses.length > 0 ? context.totalSpending / expenses.length : 0;
  return {
    totalSpending: formatCurrency(context.totalSpending),
    transactionCount: expenses.length,
    averageTransactionAmount: formatCurrency(avg),
    topCategory: sortedCategories[0] || 'None',
  };
}

/**
 * Builds spending and share details for categories.
 */
function buildCategoryBreakdown(
  context: AggregationContext,
  sortedCategories: CanonicalExpenseCategory[],
): Record<string, CategoryMetrics> {
  const breakdown: Record<string, CategoryMetrics> = {};
  for (const cat of sortedCategories) {
    const catSum = context.categoryTotals[cat] || 0;
    breakdown[cat] = {
      totalSpending: formatCurrency(catSum),
      percentageOfTotal: calculatePercentage(catSum, context.totalSpending),
      transactionCount: context.categoryCounts[cat] || 0,
    };
  }
  return breakdown;
}

/**
 * Public facing orchestrator function to compute high-fidelity analytical metrics.
 */
export function computeExpenseStatsJson(expenses: Expense[]): string {
  if (expenses.length === 0) {
    return JSON.stringify({
      summary: { totalSpending: 0, transactionCount: 0, averageTransactionAmount: 0, topCategory: 'None' },
      extremes: {},
      temporal: { monthlySpending: {}, dailyTrends: {}, peakSpendingDayOfWeek: 'None' },
      categoryBreakdown: {},
      topMerchantsBySpending: [],
      mostFrequentMerchants: [],
    });
  }

  const context = aggregateExpenseData(expenses);
  const sortedCategories = (Object.keys(context.categoryTotals) as CanonicalExpenseCategory[]).sort(
    (a, b) => (context.categoryTotals[b] || 0) - (context.categoryTotals[a] || 0),
  );

  return JSON.stringify({
    summary: buildSummary(expenses, context, sortedCategories),
    extremes: buildExtremes(context),
    temporal: buildTemporalTrends(context),
    categoryBreakdown: buildCategoryBreakdown(context, sortedCategories),
    topMerchantsBySpending: buildTopMerchants(context),
    mostFrequentMerchants: buildMostFrequentMerchants(context),
  });
}
