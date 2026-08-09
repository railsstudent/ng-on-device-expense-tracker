import { sanitizeJsonString } from './json.utils';

describe('jsonUtils', () => {
  describe('sanitizeJsonString', () => {
    it('should pass through already clean JSON strings unchanged', () => {
      const input = '{"merchantName": "Target", "amount": 24.50}';
      expect(sanitizeJsonString(input)).toBe(input);
    });

    it('should remove markdown codeblocks', () => {
      const input = '```json\n{"merchantName": "Target", "amount": 24.50}\n```';
      const expected = '{"merchantName": "Target", "amount": 24.50}';
      expect(sanitizeJsonString(input)).toBe(expected);
    });

    it('should strip leading and trailing conversational text', () => {
      const input =
        'Sure! Here is the JSON you requested:\n{"merchantName": "Walmart", "amount": 10.00}\nHope this helps!';
      const expected = '{"merchantName": "Walmart", "amount": 10.00}';
      expect(sanitizeJsonString(input)).toBe(expected);
    });

    it('should handle codeblocks nested with conversational text', () => {
      const input = 'Conversation\n```\n{"merchantName": "Costco", "amount": 120.00}\n```\nMore fluff';
      const expected = '{"merchantName": "Costco", "amount": 120.00}';
      expect(sanitizeJsonString(input)).toBe(expected);
    });

    it('should extract JSON correctly when merchantName, amount, and only category exist', () => {
      const input = 'Here is the result:\n{"merchantName": "Target", "amount": 24.50, "category": "Transport"}\nDone.';
      const expected = '{"merchantName": "Target", "amount": 24.50, "category": "Transport"}';
      expect(sanitizeJsonString(input)).toBe(expected);
    });

    it('should extract JSON correctly when merchantName, amount, and only transactionDate exist', () => {
      const input =
        'JSON output:\n{"merchantName": "Walmart", "amount": 10.00, "transactionDate": "2026-08-10"}\nHope this helps!';
      const expected = '{"merchantName": "Walmart", "amount": 10.00, "transactionDate": "2026-08-10"}';
      expect(sanitizeJsonString(input)).toBe(expected);
    });

    it('should extract JSON correctly when merchantName, amount, category, and transactionDate exist', () => {
      const input =
        'Output:\n{"merchantName": "Costco", "amount": 120.00, "category": "Groceries", "transactionDate": "2026-08-10"}\nBye!';
      const expected =
        '{"merchantName": "Costco", "amount": 120.00, "category": "Groceries", "transactionDate": "2026-08-10"}';
      expect(sanitizeJsonString(input)).toBe(expected);
    });

    it('should handle empty or falsy inputs gracefully returning empty string', () => {
      expect(sanitizeJsonString('')).toBe('');
    });

    it('should handle invalid JSON with no matching curly braces by returning empty string', () => {
      expect(sanitizeJsonString('There is no json data here')).toBe('');
      expect(sanitizeJsonString('{unmatchedBrace')).toBe('');
    });
  });
});
