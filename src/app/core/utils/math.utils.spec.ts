import { formatCurrency, calculatePercentage } from './math.utils';

describe('formatCurrency', () => {
  it('should round numbers to 2 decimal places', () => {
    expect(formatCurrency(10.556)).toBe(10.56);
    expect(formatCurrency(10.554)).toBe(10.55);
  });

  it('should preserve already rounded numbers', () => {
    expect(formatCurrency(10.55)).toBe(10.55);
    expect(formatCurrency(10)).toBe(10.0);
  });

  it('should handle zero, negatives, and precision thresholds', () => {
    expect(formatCurrency(0)).toBe(0);
    expect(formatCurrency(-12.345)).toBe(-12.35);
    expect(formatCurrency(0.004)).toBe(0);
    expect(formatCurrency(0.006)).toBe(0.01);
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentages with 1 decimal precision', () => {
    expect(calculatePercentage(16, 58)).toBe(27.6);
    expect(calculatePercentage(42, 58)).toBe(72.4);
    expect(calculatePercentage(10, 100)).toBe(10);
  });

  it('should handle zero, negative parts, and values exceeding 100%', () => {
    expect(calculatePercentage(0, 100)).toBe(0);
    expect(calculatePercentage(-5, 100)).toBe(-5);
    expect(calculatePercentage(150, 100)).toBe(150);
  });

  it('should return 0 when total is less than or equal to 0', () => {
    expect(calculatePercentage(5, 0)).toBe(0);
    expect(calculatePercentage(10, -50)).toBe(0);
  });
});
