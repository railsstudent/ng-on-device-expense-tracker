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

  it('should support stemmed keyword variations and irregular forms', () => {
    // Regular inflections
    expect(isQuerySafeAndRelevant('Do I spend too much on traveling?')).toBe(true);
    expect(isQuerySafeAndRelevant('Am I shopping too much?')).toBe(true);
    expect(isQuerySafeAndRelevant('Show my shopping categories.')).toBe(true);

    // Irregular lemmas
    expect(isQuerySafeAndRelevant('Who spent the most last month?')).toBe(true);
    expect(isQuerySafeAndRelevant('What did I buy yesterday?')).toBe(true);
    expect(isQuerySafeAndRelevant('What was bought on amazon?')).toBe(true);
    expect(isQuerySafeAndRelevant('My flight to New York.')).toBe(true);
  });
});
