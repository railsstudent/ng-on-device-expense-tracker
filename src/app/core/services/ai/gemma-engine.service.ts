import { OnDestroy, Service, inject } from '@angular/core';
import { Engine } from '@litert-lm/core';
import { AiModelCacheService } from './ai-model-cache.service';

@Service()
export class GemmaEngineService implements OnDestroy {
  readonly #cacheService = inject(AiModelCacheService);
  #engine: Engine | null = null;
  #initPromise: Promise<Engine> | null = null;

  private async initializeEngine(): Promise<Engine> {
    try {
      const localBlobUrl = await this.#cacheService.getModelUrl();
      if (!localBlobUrl) {
        throw new Error('Gemma 4 local weights are not cached in the browser yet. Please download them first.');
      }

      const instance = await Engine.create({
        model: localBlobUrl,
        mainExecutorSettings: {
          maxNumTokens: 4096,
        },
      });

      this.#engine = instance;
      this.#initPromise = null;
      return instance;
    } catch (err) {
      console.error('Error initializing LiteRT-LM engine:', err);
      this.#initPromise = null;
      throw err;
    }
  }

  /**
   * Lazily initializes and returns the shared singleton WebGPU Engine instance.
   * Leverages a cached Promise lock to prevent concurrent overlapping model loads.
   */
  public getEngine(): Promise<Engine> {
    if (this.#engine) {
      return Promise.resolve(this.#engine);
    }

    if (!this.#initPromise) {
      this.#initPromise = this.initializeEngine();
    }

    return this.#initPromise;
  }

  /**
   * Releases the shared Engine WebGPU and Web Worker resources cleanly.
   */
  public async deleteEngine(): Promise<void> {
    if (this.#engine) {
      try {
        await this.#engine.delete();
      } catch (err) {
        console.warn('Error releasing LiteRT-LM engine resources:', err);
      }
      this.#engine = null;
    }
    this.#initPromise = null;
  }

  public async ngOnDestroy(): Promise<void> {
    await this.deleteEngine();
  }
}
