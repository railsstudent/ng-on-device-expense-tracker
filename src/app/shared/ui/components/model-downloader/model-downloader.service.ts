import { inject, Service, computed } from '@angular/core';
import { AiModelCacheService } from '@/core/services/ai/ai-model-cache.service';
import { NAVIGATOR } from '@/core/consts/window.const';
import { createOnlineStatusSignal } from '@/core/utils/network.utils';

@Service()
export class ModelDownloaderService {
  readonly #cacheService = inject(AiModelCacheService);
  readonly #navigator = inject(NAVIGATOR);

  // Load-time network tracking signal
  public readonly isOnline = createOnlineStatusSignal(this.#navigator);

  // Directly reference already-read-only signals to simplify the reactive graph
  public readonly status = this.#cacheService.status;
  public readonly progress = this.#cacheService.progress;

  // Derive connection/caching states
  public readonly isCached = computed(() => this.status() === 'cached');
  public readonly isDownloading = computed(() => this.status() === 'downloading');

  // Disable button if offline and not already downloaded/cached
  public readonly isDownloadDisabled = computed(() => !this.isOnline() && !this.isCached());

  /**
   * Delegates model downloading to the core caching layer.
   */
  public async downloadModel(): Promise<string> {
    return this.#cacheService.downloadModel();
  }
}
