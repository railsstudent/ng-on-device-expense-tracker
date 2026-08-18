import { describe, expect, it } from 'vitest';
import { Expense, CanonicalExpenseCategory } from '@/shared/interfaces/expense.interface';
import { computeExpenseStatsJson } from './insight-calculator.utils';

describe('computeExpenseStatsJson - Empty State', () => {
  it('should return a clean default empty JSON structure when expenses list is empty', () => {
    const expenses: Expense[] = [];
    const jsonString = computeExpenseStatsJson(expenses);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toEqual({
      summary: {
        totalSpending: 0,
        transactionCount: 0,
        averageTransactionAmount: 0,
        topCategory: 'None',
      },
      extremes: {
        highest: null,
        lowest: null,
      },
      temporal: {
        monthlySpending: {},
        peakSpendingDayOfWeek: 'None',
      },
      categoryBreakdown: {},
      topMerchantsBySpending: [],
      mostFrequentMerchants: [],
    });
  });
});

describe('computeExpenseStatsJson - Aggregation and Sorting Analysis', () => {
  it('should correctly calculate totals, averages, category/merchant metrics, and extremes', () => {
    const expenses: Expense[] = [
      {
        id: 1,
        merchantName: 'Starbucks',
        amount: 5.5,
        transactionDate: '2026-08-10', // Monday
        category: 'dining',
      },
      {
        id: 2,
        merchantName: 'Starbucks',
        amount: 10.0,
        transactionDate: '2026-08-11', // Tuesday
        category: 'dining',
      },
      {
        id: 3,
        merchantName: 'Uber',
        amount: 50.0,
        transactionDate: '2026-08-15', // Saturday
        category: 'travel',
      },
      {
        id: 4,
        merchantName: 'Uber',
        amount: 120.0,
        transactionDate: '2026-08-16', // Sunday
        category: 'travel',
      },
      {
        id: 5,
        merchantName: 'Arcade',
        amount: 30.0,
        transactionDate: '2026-07-20', // Monday
        category: 'shopping',
      },
    ];

    const jsonString = computeExpenseStatsJson(expenses);
    const parsed = JSON.parse(jsonString);

    // 1. Summary Checks
    expect(parsed.summary.totalSpending).toBe(215.5);
    expect(parsed.summary.transactionCount).toBe(5);
    expect(parsed.summary.averageTransactionAmount).toBe(43.1);
    expect(parsed.summary.topCategory).toBe('travel');

    // 2. Extremes Checks
    expect(parsed.extremes.highest).toEqual({
      merchant: 'Uber',
      amount: 120.0,
      date: '2026-08-16',
      category: 'travel',
    });
    expect(parsed.extremes.lowest).toEqual({
      merchant: 'Starbucks',
      amount: 5.5,
      date: '2026-08-10',
      category: 'dining',
    });

    // 3. Temporal Checks
    expect(parsed.temporal.monthlySpending).toEqual({
      '2026-08': 185.5,
      '2026-07': 30.0,
    });
    expect(parsed.temporal.dailySpending).toEqual({
      '2026-08-10': 5.5,
      '2026-08-11': 10.0,
      '2026-08-15': 50.0,
      '2026-08-16': 120.0,
      '2026-07-20': 30.0,
    });
    expect(parsed.temporal.peakSpendingDayOfWeek).toBe('Sunday');

    // 4. Category Breakdown Checks
    expect(parsed.categoryBreakdown['travel']).toEqual({
      totalSpending: 170.0,
      percentageOfTotal: 78.9,
      transactionCount: 2,
    });
    expect(parsed.categoryBreakdown['shopping']).toEqual({
      totalSpending: 30.0,
      percentageOfTotal: 13.9,
      transactionCount: 1,
    });
    expect(parsed.categoryBreakdown['dining']).toEqual({
      totalSpending: 15.5,
      percentageOfTotal: 7.2,
      transactionCount: 2,
    });

    // 5. Merchant Checks
    expect(parsed.topMerchantsBySpending[0]).toEqual({
      merchant: 'Uber',
      totalSpending: 170.0,
    });
    expect(parsed.topMerchantsBySpending[1]).toEqual({
      merchant: 'Arcade',
      totalSpending: 30.0,
    });

    // Frequency Checks
    const frequentStarbucks = parsed.mostFrequentMerchants.find(
      (m: { merchant: string }) => m.merchant === 'Starbucks',
    );
    const frequentUber = parsed.mostFrequentMerchants.find((m: { merchant: string }) => m.merchant === 'Uber');
    expect(frequentStarbucks?.visitCount).toBe(2);
    expect(frequentUber?.visitCount).toBe(2);
  });
});

describe('computeExpenseStatsJson - Robustness & Edge Cases', () => {
  it('should fallback to defaults when optional properties are missing', () => {
    const expenses: Expense[] = [
      {
        id: 6,
        merchantName: '', // empty merchant
        amount: 45.0,
        transactionDate: '2026-08-12',
        category: '' as unknown as CanonicalExpenseCategory, // force empty category for testing robust fallback
      },
    ];

    const jsonString = computeExpenseStatsJson(expenses);
    const parsed = JSON.parse(jsonString);

    expect(parsed.summary.topCategory).toBe('other');
    expect(parsed.categoryBreakdown['other']).toBeDefined();
    expect(parsed.topMerchantsBySpending[0]).toEqual({
      merchant: 'Unknown',
      totalSpending: 45.0,
    });
  });

  it('should safely handle missing, short, or invalid transactionDate values without crashing', () => {
    const expenses: Expense[] = [
      {
        id: 7,
        merchantName: 'A Store',
        amount: 15.0,
        transactionDate: '', // empty date
        category: 'dining',
      },
      {
        id: 8,
        merchantName: 'B Store',
        amount: 25.0,
        transactionDate: '2026', // short invalid date
        category: 'dining',
      },
      {
        id: 9,
        merchantName: 'C Store',
        amount: 35.0,
        transactionDate: 'invalid-date-string', // unparseable date
        category: 'dining',
      },
    ];

    const jsonString = computeExpenseStatsJson(expenses);
    const parsed = JSON.parse(jsonString);

    // Summary should still count them
    expect(parsed.summary.totalSpending).toBe(75.0);
    expect(parsed.summary.transactionCount).toBe(3);
    expect(parsed.summary.averageTransactionAmount).toBe(25.0);

    // Monthly spending should not include invalid months (or key should be safely excluded)
    expect(parsed.temporal.monthlySpending).toEqual({});
    expect(parsed.temporal.peakSpendingDayOfWeek).toBe('None');
  });

  it('should converge highest and lowest extremes to the same item when single expense exists', () => {
    const expenses: Expense[] = [
      {
        id: 10,
        merchantName: 'Single Store',
        amount: 99.99,
        transactionDate: '2026-08-01',
        category: 'shopping',
      },
    ];

    const jsonString = computeExpenseStatsJson(expenses);
    const parsed = JSON.parse(jsonString);

    expect(parsed.extremes.highest).toEqual({
      merchant: 'Single Store',
      amount: 99.99,
      date: '2026-08-01',
      category: 'shopping',
    });
    expect(parsed.extremes.lowest).toEqual({
      merchant: 'Single Store',
      amount: 99.99,
      date: '2026-08-01',
      category: 'shopping',
    });
  });

  it('should handle category and merchant ties stably during sorting', () => {
    const expenses: Expense[] = [
      {
        id: 11,
        merchantName: 'Merchant A',
        amount: 50.0,
        transactionDate: '2026-08-01',
        category: 'travel',
      },
      {
        id: 12,
        merchantName: 'Merchant B',
        amount: 50.0,
        transactionDate: '2026-08-01',
        category: 'dining',
      },
    ];

    const jsonString = computeExpenseStatsJson(expenses);
    const parsed = JSON.parse(jsonString);

    // Should return both without crash
    expect(parsed.topMerchantsBySpending.length).toBe(2);
    expect(parsed.mostFrequentMerchants.length).toBe(2);
  });
});
