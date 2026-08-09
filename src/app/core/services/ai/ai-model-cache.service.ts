import { Service, signal, inject } from '@angular/core';
import { WINDOW, CACHE_STORAGE } from '../../consts/window.const';

interface FileProxyCacheStatic {
  loadFromURL(url: string, progressCallback: (text: string) => void): Promise<string>;
  setCacheName(name: string): void;
  setShardSize(size: number): void;
  enableDebug(enabled: boolean): void;
}
declare const FileProxyCache: FileProxyCacheStatic;

export type CacheStatus = 'not-downloaded' | 'downloading' | 'cached';

@Service()
export class AiModelCacheService {
  private readonly window = inject(WINDOW);
  private readonly cacheStorage = inject(CACHE_STORAGE);

  // Official Hugging Face URL for Gemma 4 E2B LiteRT-LM model
  private readonly modelUrl =
    'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm';

  // Private backing signals
  readonly #status = signal<CacheStatus>('not-downloaded');
  readonly #progress = signal<number>(0);
  readonly #speed = signal<number>(0);

  // Public read-only signals
  public readonly status = this.#status.asReadonly();
  public readonly progress = this.#progress.asReadonly();
  public readonly speed = this.#speed.asReadonly();

  constructor() {
    this.checkInitialCacheState();
  }

  /**
   * Checks the Cache Storage on startup to see if the model has already been saved.
   */
  private async checkInitialCacheState(): Promise<void> {
    if (!this.cacheStorage) {
      return;
    }

    try {
      const cache = await this.cacheStorage.open('JMWebAIModels');
      const keys = await cache.keys();
      const hashHex = await this.sha256(this.modelUrl);

      let found = false;
      let i = 0;
      while (i < keys.length) {
        const keyUrl = keys[i].url;
        if (keyUrl.indexOf(hashHex) !== -1 && keyUrl.indexOf('-shard-0') !== -1) {
          found = true;
          break;
        }
        i = i + 1; // Strict increment syntax
      }

      if (found) {
        this.#status.set('cached');
        this.#progress.set(100);
      } else {
        this.#status.set('not-downloaded');
        this.#progress.set(0);
      }
    } catch (err) {
      console.error('Error checking initial model cache status:', err);
      this.#status.set('not-downloaded');
      this.#progress.set(0);
    }
  }

  /**
   * Downloads and caches the model using the local vendored FileProxyCache library.
   * Updates progress and speed signals in real-time.
   */
  public async downloadModel(): Promise<string> {
    if (!this.cacheStorage) {
      throw new Error('Cache Storage is not supported in this environment.');
    }

    this.#status.set('downloading');
    this.#progress.set(0);
    this.#speed.set(0);

    try {
      // Execute the local cache proxy loader with our progress callback
      const localBlobUrl = await FileProxyCache.loadFromURL(this.modelUrl, (textUpdate: string) => {
        this.parseAndSetProgress(textUpdate);
      });

      this.#status.set('cached');
      this.#progress.set(100);
      this.#speed.set(0);

      return localBlobUrl;
    } catch (err) {
      console.error('Error downloading and caching AI model weights:', err);
      this.#status.set('not-downloaded');
      this.#progress.set(0);
      this.#speed.set(0);
      throw err;
    }
  }

  /**
   * Fast getter to retrieve the cached model's local blob URL if it exists.
   */
  public async getModelUrl(): Promise<string | null> {
    if (this.#status() === 'cached') {
      try {
        const silentProgressCallback = (): void => {
          // No-op for silent local cache loading
        };
        return await FileProxyCache.loadFromURL(this.modelUrl, silentProgressCallback);
      } catch (err) {
        console.error('Error loading model from local cache:', err);
        return null;
      }
    }
    return null;
  }

  /**
   * Parses the human-readable text status returned by FileProxyCache and updates our Signals.
   */
  private parseAndSetProgress(text: string): void {
    if (!text) {
      return;
    }

    // 1. Extract numerical percentage (e.g., "15%")
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch) {
      this.#progress.set(parseInt(percentMatch[1], 10));
    }

    // 2. Extract speed (e.g., "4.5 MB/s")
    const speedMatch = text.match(/([\d.]+)\s*MB\/s/);
    if (speedMatch) {
      this.#speed.set(parseFloat(speedMatch[1]));
    }
  }

  /**
   * Calculates SHA-256 hash using SubtleCrypto, matches FileProxyCache internal hashing.
   */
  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    if (!this.window || !this.window.crypto || !this.window.crypto.subtle) {
      return 'gemma-4-E2B-it.litertlm';
    }
    try {
      const hashBuffer = await this.window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray
        .map((b) => {
          return b.toString(16).padStart(2, '0');
        })
        .join('');
    } catch (err) {
      console.error('Error generating SHA-256 hash:', err);
      return 'gemma-4-E2B-it.litertlm';
    }
  }
}
