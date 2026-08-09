/**
 * Checks if the browser's SubtleCrypto API is supported and available in the current environment.
 */
export const isSubtleCryptoAvailable = (win: Window | null): boolean => !!(win && win.crypto && win.crypto.subtle);

/**
 * Generates a SHA-256 hash string for a given message in an SSR-safe manner,
 * utilizing the browser's SubtleCrypto API if available.
 *
 * @param message The input string to hash.
 * @param win Reference to the browser Window object (from Angular WINDOW token).
 * @returns SHA-256 hex string, or null on failure/lack of support.
 */
export async function sha256(message: string, win: Window | null): Promise<string | null> {
  if (!isSubtleCryptoAvailable(win)) {
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await win!.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error generating SHA-256 hash:', err);
    return null;
  }
}
