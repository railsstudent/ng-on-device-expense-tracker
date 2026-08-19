/**
 * Represents general aggregate metrics (total spent, percentage of total, transaction count)
 * for a specific category, either globally or per-day.
 */
export interface CategoryMetrics {
  totalSpending: number;
  percentageOfTotal: number;
  transactionCount: number;
}
