/**
 * Parses the human-readable progress percentage text returned by FileProxyCache.
 *
 * @param text The status string containing the progress percentage (e.g. "Loading file: 15%").
 * @returns The parsed percentage number, or null if no match is found.
 */
export function parseProgressPercentage(text: string): number | null {
  if (!text) {
    return null;
  }

  const percentMatch = text.match(/(\d+)(?:\.\d+)?%/);
  if (percentMatch) {
    return parseInt(percentMatch[1], 10);
  }

  return null;
}
