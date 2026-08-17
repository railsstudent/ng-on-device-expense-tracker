import { TOXIC_WORDS, FINANCE_KEYWORDS } from '@/core/consts/ai-safety.const';
import { stemmer } from '@/core/utils/stemmer';

// Irregular lemmas dictionary to map semantic irregular variations
const IRREGULAR_LEMMAS: Record<string, string> = {
  spent: 'spend',
  bought: 'buy',
  flight: 'travel',
  flights: 'travel',
  trip: 'travel',
  trips: 'travel',
  vacation: 'travel',
  vacations: 'travel',
};

/**
 * Normalizes a word and returns its root semantic stem.
 */
function getWordStem(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (IRREGULAR_LEMMAS[clean]) {
    return IRREGULAR_LEMMAS[clean];
  }
  return stemmer(clean);
}

/**
 * Validates a user's prompt query to ensure it is safe (non-toxic) and relevant to financial analytics.
 * Executed as a fast client-side check to prevent redundant WebGPU prefilling execution.
 */
export function isQuerySafeAndRelevant(query: string): boolean {
  const normalized = query.toLowerCase().trim();
  if (normalized.length < 3) {
    return false;
  }

  // Toxic and offensive words block
  const containsToxic = TOXIC_WORDS.some((word) => normalized.includes(word));
  if (containsToxic) {
    return false;
  }

  // Tokenize and stem each word token
  const words = normalized.split(/\s+/);
  const stemmedWords = words.map((word) => getWordStem(word));

  // Multi-dimensional matching check
  return FINANCE_KEYWORDS.some((keyword) => {
    // 1. Phrase-level matching (e.g. for multi-word entries like "how much")
    if (normalized.includes(keyword)) {
      return true;
    }
    // 2. Token-level matching (checks all stemmed semantic roots)
    return stemmedWords.includes(keyword);
  });
}
