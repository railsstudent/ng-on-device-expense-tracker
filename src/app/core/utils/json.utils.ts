/**
 * Sanitizes the raw LLM output, removing any markdown code blocks or conversational fluff
 * to yield a clean, parsable JSON string.
 *
 * @param raw The raw output string from the AI model.
 * @returns Cleaned JSON string.
 */
export function sanitizeJsonString(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  let text = raw.trim();

  // Remove markdown code blocks if the model appended them
  if (text.startsWith('```')) {
    const firstLineEnd = text.indexOf('\n');
    if (firstLineEnd !== -1) {
      text = text.substring(firstLineEnd + 1);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();
  }

  // Strip any leading text before the first '{' and trailing text after the last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return '';
  }

  return text.substring(firstBrace, lastBrace + 1);
}
