import { isSubtleCryptoAvailable, sha256 } from './crypto.utils';

describe('cryptoUtils', () => {
  describe('isSubtleCryptoAvailable', () => {
    it('should return true if SubtleCrypto API is supported', () => {
      const mockWin = {
        crypto: {
          subtle: {},
        },
      } as unknown as Window;
      expect(isSubtleCryptoAvailable(mockWin)).toBe(true);
    });

    it('should return false if Window crypto or subtle is missing', () => {
      const mockWinNoSubtle = {
        crypto: {},
      } as unknown as Window;
      expect(isSubtleCryptoAvailable(mockWinNoSubtle)).toBe(false);

      const mockWinNoCrypto = {} as unknown as Window;
      expect(isSubtleCryptoAvailable(mockWinNoCrypto)).toBe(false);
    });

    it('should return false if Window is null', () => {
      expect(isSubtleCryptoAvailable(null)).toBe(false);
    });
  });

  describe('sha256', () => {
    it('should resolve to null if SubtleCrypto is unavailable', async () => {
      const result = await sha256('test-message', null);
      expect(result).toBeNull();
    });

    it('should generate correct SHA-256 hash using SubtleCrypto if available', async () => {
      const mockDigest = vi
        .fn()
        .mockResolvedValue(
          new Uint8Array([
            44, 242, 77, 186, 95, 176, 163, 14, 38, 232, 59, 42, 197, 185, 226, 158, 27, 22, 30, 92, 31, 167, 66, 94,
            115, 4, 54, 41, 62, 11, 152, 36,
          ]).buffer,
        );

      const mockWin = {
        crypto: {
          subtle: {
            digest: mockDigest,
          },
        },
      } as unknown as Window;

      const result = await sha256('hello', mockWin);

      expect(mockDigest).toHaveBeenCalled();
      // "hello" has the exact hash: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
      expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e730436293e0b9824');
    });

    it('should catch digest exceptions and return null fallback', async () => {
      // Mock console.error to avoid polluting output during tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        /* no-op */
      });

      const mockDigestError = vi.fn().mockRejectedValue(new Error('Internal Cryptographic Error'));

      const mockWin = {
        crypto: {
          subtle: {
            digest: mockDigestError,
          },
        },
      } as unknown as Window;

      const result = await sha256('hello', mockWin);

      expect(mockDigestError).toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
