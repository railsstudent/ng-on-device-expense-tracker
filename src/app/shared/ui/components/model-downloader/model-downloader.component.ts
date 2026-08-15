import { Component, inject } from '@angular/core';
import { ModelDownloaderService } from './model-downloader.service';

@Component({
  selector: 'app-model-downloader',
  templateUrl: './model-downloader.component.html',
  styleUrls: ['./model-downloader.component.css'],
})
export class ModelDownloaderComponent {
  readonly #service = inject(ModelDownloaderService);

  // Direct, lightweight references to the service's read-only signals (no computed wrappers)
  protected readonly isDownloaded = this.#service.isCached;
  protected readonly isDownloading = this.#service.isDownloading;
  protected readonly downloadProgress = this.#service.progress;
  protected readonly isDownloadDisabled = this.#service.isDownloadDisabled;

  /**
   * Invokes the real model download process from our core service.
   */
  protected startDownload(): void {
    if (this.isDownloading() || this.isDownloaded()) {
      return;
    }
    this.#service.downloadModel().catch((err) => {
      console.error('Failed to download model weights:', err);
    });
  }
}
