import { Expense, CanonicalExpenseCategory } from '@/shared/interfaces/expense.interface';
import { AggregationContext, DayOfWeek } from '@/shared/interfaces/aggregation-context.interface';

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
 * Aggregates raw transactional data in a single clean pass.
 */
function aggregateExpenseData(expenses: Expense[]): AggregationContext {
  const context: AggregationContext = {
    totalSpending: 0,
    categoryTotals: {},
    categoryCounts: {},
    merchantTotals: {},
    merchantCounts: {},
    monthlyTotals: {},
    dayOfWeekSpending: {},
    highestTx: null,
    lowestTx: null,
    dailyTotals: {},
  };

  for (const e of expenses) {
    const amount = e.amount;
    context.totalSpending = context.totalSpending + amount;

    // Categories
    const cat: CanonicalExpenseCategory = e.category || 'other';
    context.categoryTotals[cat] = (context.categoryTotals[cat] || 0) + amount;
    context.categoryCounts[cat] = (context.categoryCounts[cat] || 0) + 1;

    // Merchants
    const merchant = e.merchantName || 'Unknown';
    context.merchantTotals[merchant] = (context.merchantTotals[merchant] || 0) + amount;
    context.merchantCounts[merchant] = (context.merchantCounts[merchant] || 0) + 1;

    // Temporal Metrics (Monthly and Day of Week)
    updateTemporalStats(e, amount, context);

    // Daily totals
    if (e.transactionDate) {
      context.dailyTotals[e.transactionDate] = (context.dailyTotals[e.transactionDate] || 0) + amount;
    }

    // Extremes (Max/Min)
    if (!context.highestTx || amount > context.highestTx.amount) {
      context.highestTx = e;
    }
    if (!context.lowestTx || amount < context.lowestTx.amount) {
      context.lowestTx = e;
    }
  }

  return context;
}

/**
 * Builds overall summary statistics.
 */
function buildSummary(expenses: Expense[], context: AggregationContext, sortedCategories: CanonicalExpenseCategory[]) {
  const topCategory = sortedCategories[0] || 'None';
  return {
    totalSpending: Number(context.totalSpending.toFixed(2)),
    transactionCount: expenses.length,
    averageTransactionAmount: Number((context.totalSpending / expenses.length).toFixed(2)),
    topCategory: topCategory,
  };
}

/**
 * Safely builds transaction extremes.
 */
function buildExtremes(context: AggregationContext) {
  return {
    highest: context.highestTx
      ? {
          merchant: context.highestTx.merchantName || 'Unknown',
          amount: context.highestTx.amount,
          date: context.highestTx.transactionDate,
          category: context.highestTx.category || 'other',
        }
      : null,
    lowest: context.lowestTx
      ? {
          merchant: context.lowestTx.merchantName || 'Unknown',
          amount: context.lowestTx.amount,
          date: context.lowestTx.transactionDate,
          category: context.lowestTx.category || 'other',
        }
      : null,
  };
}

/**
 * Compiles monthly totals and determines peak spending day.
 */
function buildTemporalTrends(context: AggregationContext) {
  const monthlySpending: Record<string, number> = {};
  const monthKeys = Object.keys(context.monthlyTotals);
  for (const key of monthKeys) {
    monthlySpending[key] = Number(context.monthlyTotals[key].toFixed(2));
  }

  const dailySpending: Record<string, number> = {};
  const dateKeys = Object.keys(context.dailyTotals);
  for (const key of dateKeys) {
    dailySpending[key] = Number(context.dailyTotals[key].toFixed(2));
  }

  let peakDay = 'None';
  let peakDayAmount = 0;
  const dayKeys = Object.keys(context.dayOfWeekSpending) as DayOfWeek[];
  for (const day of dayKeys) {
    const amt = context.dayOfWeekSpending[day] || 0;
    if (amt > peakDayAmount) {
      peakDayAmount = amt;
      peakDay = day;
    }
  }

  return {
    monthlySpending: monthlySpending,
    dailySpending: dailySpending,
    peakSpendingDayOfWeek: peakDay,
  };
}

/**
 * Builds spending and share details for categories.
 */
function buildCategoryBreakdown(context: AggregationContext, sortedCategories: CanonicalExpenseCategory[]) {
  const breakdown: Record<string, { totalSpending: number; percentageOfTotal: number; transactionCount: number }> = {};
  for (const cat of sortedCategories) {
    const catSum = context.categoryTotals[cat] || 0;
    breakdown[cat] = {
      totalSpending: Number(catSum.toFixed(2)),
      percentageOfTotal: Number((context.totalSpending > 0 ? (catSum / context.totalSpending) * 100 : 0).toFixed(1)),
      transactionCount: context.categoryCounts[cat] || 0,
    };
  }
  return breakdown;
}

/**
 * Builds the list of top merchants based on spending volume.
 */
function buildTopMerchants(context: AggregationContext) {
  const sortedMerchants = Object.keys(context.merchantTotals)
    .sort((a, b) => context.merchantTotals[b] - context.merchantTotals[a])
    .slice(0, 5);

  const topMerchants = [];
  for (const m of sortedMerchants) {
    topMerchants.push({
      merchant: m,
      totalSpending: Number(context.merchantTotals[m].toFixed(2)),
    });
  }
  return topMerchants;
}

/**
 * Builds the list of most visited merchants.
 */
function buildMostFrequentMerchants(context: AggregationContext) {
  const sortedMerchants = Object.keys(context.merchantCounts)
    .sort((a, b) => context.merchantCounts[b] - context.merchantCounts[a])
    .slice(0, 5);

  const frequentMerchants = [];
  for (const m of sortedMerchants) {
    frequentMerchants.push({
      merchant: m,
      visitCount: context.merchantCounts[m] || 0,
    });
  }
  return frequentMerchants;
}

/**
 * Public facing orchestrator function to compute high-fidelity analytical metrics.
 */
export function computeExpenseStatsJson(expenses: Expense[]): string {
  if (expenses.length === 0) {
    const emptyData = JSON.stringify({
      summary: { totalSpending: 0, transactionCount: 0, averageTransactionAmount: 0, topCategory: 'None' },
      extremes: { highest: null, lowest: null },
      temporal: { monthlySpending: {}, peakSpendingDayOfWeek: 'None' },
      categoryBreakdown: {},
      topMerchantsBySpending: [],
      mostFrequentMerchants: [],
    });

    console.log('computeExpenseStatsJson - Empty expenses list, returning default JSON:', emptyData); // Debugging log
    return emptyData;
  }

  const context = aggregateExpenseData(expenses);
  const sortedCategories = (Object.keys(context.categoryTotals) as CanonicalExpenseCategory[]).sort(
    (a, b) => (context.categoryTotals[b] || 0) - (context.categoryTotals[a] || 0),
  );

  const data = JSON.stringify({
    summary: buildSummary(expenses, context, sortedCategories),
    extremes: buildExtremes(context),
    temporal: buildTemporalTrends(context),
    categoryBreakdown: buildCategoryBreakdown(context, sortedCategories),
    topMerchantsBySpending: buildTopMerchants(context),
    mostFrequentMerchants: buildMostFrequentMerchants(context),
  });

  console.log('computeExpenseStatsJson - Final JSON Output:', data); // Debugging log
  return data;
}
