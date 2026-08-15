import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadImageHelper, processImageInCanvas } from './image.utils';

describe('imageUtils', () => {
  describe('loadImageHelper', () => {
    it('should resolve the image once onload is called', async () => {
      const mockImageInstance = {
        set src(value: string) {
          // Simulate browser asynchronous onload trigger
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        },
        onload: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onerror: null as ((err: any) => void) | null,
        crossOrigin: '',
      };

      vi.stubGlobal('Image', function () {
        return mockImageInstance;
      });

      const resultPromise = loadImageHelper('http://localhost:4200/test.png');
      await expect(resultPromise).resolves.toBe(mockImageInstance);

      vi.unstubAllGlobals();
    });

    it('should reject the promise once onerror is called', async () => {
      const mockImageInstance = {
        set src(value: string) {
          // Simulate browser asynchronous onerror trigger
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Load failed'));
            }
          }, 0);
        },
        onload: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onerror: null as ((err: any) => void) | null,
        crossOrigin: '',
      };

      vi.stubGlobal('Image', function () {
        return mockImageInstance;
      });

      const resultPromise = loadImageHelper('http://localhost:4200/test.png');
      await expect(resultPromise).rejects.toThrow('Load failed');

      vi.unstubAllGlobals();
    });
  });

  describe('processImageInCanvas', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalObj = globalThis as any;
    const originalVitestEnv = globalObj.process?.env?.['VITEST'];

    afterEach(() => {
      if (globalObj.process?.env) {
        globalObj.process.env['VITEST'] = originalVitestEnv;
      }
    });

    it('should return null immediately if VITEST environment is active', async () => {
      if (globalObj.process?.env) {
        globalObj.process.env['VITEST'] = 'true';
      }
      const result = await processImageInCanvas('http://localhost:4200/test.png');
      expect(result).toBeNull();
    });
  });
});
