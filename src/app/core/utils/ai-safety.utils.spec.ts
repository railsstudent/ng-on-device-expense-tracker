import { describe, it, expect } from 'vitest';
import { isQuerySafeAndRelevant } from './ai-safety.utils';

describe('isQuerySafeAndRelevant', () => {
  it('should return false for empty or very short queries', () => {
    expect(isQuerySafeAndRelevant('')).toBe(false);
    expect(isQuerySafeAndRelevant('a')).toBe(false);
    expect(isQuerySafeAndRelevant('hi')).toBe(false);
  });

  it('should return false for queries containing toxic words', () => {
    expect(isQuerySafeAndRelevant('how to kill my budget')).toBe(false);
    expect(isQuerySafeAndRelevant('hate this stupid expense')).toBe(false);
  });

  it('should return true for safe queries with financial keywords', () => {
    expect(isQuerySafeAndRelevant('show my dining expenses')).toBe(true);
    expect(isQuerySafeAndRelevant('what is my total spending')).toBe(true);
    expect(isQuerySafeAndRelevant('analyze my ledger budget')).toBe(true);
  });

  it('should return false for completely safe but unrelated queries', () => {
    expect(isQuerySafeAndRelevant('where is Tokyo')).toBe(false);
    expect(isQuerySafeAndRelevant('who won the world cup')).toBe(false);
  });

  it('should be case-insensitive and handle leading/trailing whitespaces', () => {
    expect(isQuerySafeAndRelevant('  EXPENSE  ')).toBe(true);
    expect(isQuerySafeAndRelevant('sPeNdInG')).toBe(true);
    expect(isQuerySafeAndRelevant('  KiLl  ')).toBe(false);
    expect(isQuerySafeAndRelevant('HATE')).toBe(false);
  });

  it('should handle multi-line, tabs, and newline whitespace', () => {
    expect(isQuerySafeAndRelevant('my total\nbudget')).toBe(true);
    expect(isQuerySafeAndRelevant('category\tinsights')).toBe(true);
    expect(isQuerySafeAndRelevant('  \n  show\nexpenses  \n  ')).toBe(true);
    expect(isQuerySafeAndRelevant('dumb\ninsight')).toBe(false);
  });
});
