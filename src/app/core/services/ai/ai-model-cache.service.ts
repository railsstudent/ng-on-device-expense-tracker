import FileProxyCache from '@/assets/FileProxyCache.min.js';
import { AI_CACHE_NAME, DEFAULT_MODEL_FILENAME, GEMMA_MODEL_URL } from '@/core/consts/ai-model.const';
import { CACHE_STORAGE, IS_BROWSER, WINDOW } from '@/core/consts/window.const';
import { createCachedState, createDownloadingState, createNotDownloadedState } from '@/core/utils/cache-state.utils';
import { sha256 } from '@/core/utils/crypto.utils';
import { parseProgressPercentage } from '@/core/utils/progress.utils';
import { CacheState } from '@/shared/interfaces/cache-state.interface';
import { computed, inject, Service, signal } from '@angular/core';

@Service()
export class AiModelCacheService {
  readonly #isBrowser = inject(IS_BROWSER);
  readonly #window = inject(WINDOW);
  readonly #cacheStorage = inject(CACHE_STORAGE);

  // Reference to our centralized model URL
  readonly #modelUrl = GEMMA_MODEL_URL;

  // Single unified backing signal for cache state
  readonly #state = signal<CacheState>(createNotDownloadedState());

  // Promise-Init Lock: tracks the background startup cache storage inspection
  readonly #initPromise: Promise<void>;

  // Public read-only computed signals (fully backward-compatible with UI templates)
  public readonly status = computed(() => this.#state().status);

  public readonly progress = computed(() => this.#state().progress);

  constructor() {
    // Standard Angular-native check: only run cache setup and storage inspection in browser environments
    if (this.#isBrowser) {
      FileProxyCache.setCacheName(AI_CACHE_NAME);
      // Kick off background cache check and capture its promise
      this.#initPromise = this.checkInitialCacheState();
    } else {
      this.#initPromise = Promise.resolve();
    }
  }

  /**
   * Handles chunk-by-chunk download progress updates.
   */
  private handleDownloadProgress(textUpdate: string): void {
    const percent = parseProgressPercentage(textUpdate);
    if (percent !== null) {
      this.#state.set(createDownloadingState(percent));
    }
  }

  /**
   * Checks the Cache Storage on startup to see if the model has already been saved.
   */
  private async checkInitialCacheState(): Promise<void> {
    if (!this.#cacheStorage) {
      console.warn(
        'Cache Storage is not supported or available in this environment. ' +
          'Local AI model caching will be unavailable.',
      );
      this.#state.set(createNotDownloadedState());
      return;
    }

    try {
      const cache = await this.#cacheStorage.open(AI_CACHE_NAME);
      const hash = await sha256(this.#modelUrl, this.#window);
      const hashKey = hash ?? DEFAULT_MODEL_FILENAME;

      // Match the exact metadata file (hash itself)
      const metadata = await cache.match(hashKey);

      if (metadata) {
        const text = await metadata.text();
        console.log('Local AI Cache Metadata Shards Count:', text);
        const shards = parseInt(text, 10);
        if (shards > 0) {
          this.#state.set(createCachedState());
          return;
        }
      }

      this.#state.set(createNotDownloadedState());
    } catch (err) {
      console.error('Error checking initial model cache status:', err);
      this.#state.set(createNotDownloadedState());
    }
  }

  /**
   * Downloads and caches the model using the local vendored FileProxyCache library.
   * Updates progress signals in real-time.
   */
  public async downloadModel(): Promise<string> {
    // 1. Await background initialization to prevent race conditions
    await this.#initPromise;

    // 2. Short-circuit: if already cached, skip heavy downloads entirely
    if (this.#state().status === 'cached') {
      const cachedUrl = await this.getModelUrl();
      if (cachedUrl) {
        return cachedUrl;
      }
    }

    if (!this.#cacheStorage) {
      throw new Error('Cache Storage is not supported in this environment.');
    }

    this.#state.set(createDownloadingState(0));

    try {
      // Execute the local cache proxy loader with our progress callback
      const localBlobUrl = await FileProxyCache.loadFromURL(this.#modelUrl, (textUpdate: string) =>
        this.handleDownloadProgress(textUpdate),
      );

      this.#state.set(createCachedState());

      return localBlobUrl;
    } catch (err) {
      console.error('Error downloading and caching AI model weights:', err);
      this.#state.set(createNotDownloadedState());
      throw err;
    }
  }

  /**
   * Fast getter to retrieve the cached model's local blob URL if it exists.
   */
  public async getModelUrl(): Promise<string | null> {
    // Await background initialization to ensure the cache state is correct
    await this.#initPromise;

    if (this.#state().status === 'cached') {
      try {
        return await FileProxyCache.loadFromURL(this.#modelUrl);
      } catch (err) {
        console.error('Error loading model from local cache:', err);
        return null;
      }
    }
    return null;
  }
}
