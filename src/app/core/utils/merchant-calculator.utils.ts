import { AggregationContext } from '@/shared/interfaces/aggregation-context.interface';
import { formatCurrency } from '@/core/utils/math.utils';

/**
 * Helper to retrieve the top keys from a record, sorted descending by their values.
 */
export function getTopKeys(record: Record<string, number>, limit = 5): string[] {
  return Object.keys(record)
    .sort((a, b) => record[b] - record[a])
    .slice(0, limit);
}

/**
 * Builds the list of top merchants based on spending volume.
 */
export function buildTopMerchants(context: AggregationContext) {
  return getTopKeys(context.merchantTotals).map((merchant) => ({
    merchant,
    totalSpending: formatCurrency(context.merchantTotals[merchant]),
  }));
}

/**
 * Builds the list of most visited merchants.
 */
export function buildMostFrequentMerchants(context: AggregationContext) {
  return getTopKeys(context.merchantCounts).map((merchant) => ({
    merchant,
    visitCount: context.merchantCounts[merchant] || 0,
  }));
}
