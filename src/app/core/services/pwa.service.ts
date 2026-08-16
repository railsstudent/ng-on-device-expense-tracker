import { NAVIGATOR, IS_BROWSER } from '@/core/consts/window.const';
import { inject, Service, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Service()
export class PwaService {
  readonly #isBrowser = inject(IS_BROWSER);
  readonly #swUpdate = inject(SwUpdate);
  readonly #navigator = inject(NAVIGATOR);

  // Expose a read-only reactive signal of the PWA status
  readonly #status = signal<string>('Checking...');
  public readonly status = this.#status.asReadonly();

  // Promise-Init Lock: tracks background service worker and update subscription flow
  readonly #initPromise: Promise<void>;

  constructor() {
    if (this.#isBrowser) {
      this.#initPromise = this.initializePwaTracker();
    } else {
      this.#status.set('Not Supported (SSR Mode)');
      this.#initPromise = Promise.resolve();
    }
  }

  private async initializePwaTracker(): Promise<void> {
    if (!this.#navigator || !('serviceWorker' in this.#navigator)) {
      this.#status.set('Not Supported by Browser');
      return;
    }

    try {
      const registration = await this.#navigator.serviceWorker.getRegistration();
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
