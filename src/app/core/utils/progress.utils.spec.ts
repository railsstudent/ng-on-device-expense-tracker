import { parseProgressPercentage } from './progress.utils';

describe('progressUtils', () => {
  describe('parseProgressPercentage', () => {
    it('should extract correct integer from percentage text', () => {
      expect(parseProgressPercentage('Loading file: 15%')).toBe(15);
      expect(parseProgressPercentage('Loading file: 100%')).toBe(100);
      expect(parseProgressPercentage('0%')).toBe(0);
    });

    it('should return null if no percentage is present', () => {
      expect(parseProgressPercentage('Loading file...')).toBeNull();
      expect(parseProgressPercentage('File loading in chunks')).toBeNull();
    });

    it('should handle empty or falsy inputs gracefully', () => {
      expect(parseProgressPercentage('')).toBeNull();
    });

    it('should extract percentage when other numbers are present in the text', () => {
      expect(parseProgressPercentage('Downloaded 3 of 10 files (45% completed)')).toBe(45);
    });

    it('should extract correct integer when decimal percentage is present', () => {
      expect(parseProgressPercentage('Loading: 15.5%')).toBe(15);
    });
  });
});
