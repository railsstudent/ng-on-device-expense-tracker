import { inject, Service, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';

@Service()
export class PwaService {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #swUpdate = inject(SwUpdate);

  // Expose a read-only reactive signal of the PWA status
  readonly #status = signal<string>('Checking...');
  public readonly status = this.#status.asReadonly();

  // Promise-Init Lock: tracks background service worker and update subscription flow
  readonly #initPromise: Promise<void>;

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      this.#initPromise = this.initializePwaTracker();
    } else {
      this.#status.set('Not Supported (SSR Mode)');
      this.#initPromise = Promise.resolve();
    }
  }

  private async initializePwaTracker(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      this.#status.set('Not Supported by Browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        this.#status.set(`Active (Scope: ${registration.scope})`);
      } else {
        this.#status.set('Ready (Registered upon Production Build)');
      }

      if (this.#swUpdate.isEnabled) {
        this.#swUpdate.versionUpdates.subscribe((evt) => {
          if (evt.type === 'VERSION_READY') {
            this.#status.set('Update Available! Please reload.');
          }
        });
      }
    } catch {
      this.#status.set('Failed to check Service Worker');
    }
  }

  /**
   * Safe check for background updates, awaiting the boot initialization lock first.
   */
  public async checkForUpdates(): Promise<boolean> {
    await this.#initPromise;
    if (this.#swUpdate.isEnabled) {
      return this.#swUpdate.checkForUpdate();
    }
    return false;
  }
}
