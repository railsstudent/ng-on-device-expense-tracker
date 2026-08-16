import { TOXIC_WORDS, FINANCE_KEYWORDS } from '@/core/consts/ai-safety.const';

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

  // Finance-related keywords check
  return FINANCE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
