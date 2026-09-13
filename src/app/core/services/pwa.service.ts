import { PWA_CHECK_INTERVAL } from '@/core/consts/pwa.constant';
import { WINDOW } from '@/core/consts/window.const';
import { ApplicationRef, DestroyRef, inject, Service } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { catchError, concat, EMPTY, exhaustMap, filter, from, interval, map, take } from 'rxjs';

@Service()
export class PwaService {
  readonly #swUpdate = inject(SwUpdate);
  readonly #win = inject(WINDOW);
  readonly #destroyRef$ = inject(DestroyRef);
  readonly #pwaCheckInterval = inject(PWA_CHECK_INTERVAL);
  readonly #appRef = inject(ApplicationRef);

  updateAvailable = toSignal(
    this.#win && this.#swUpdate.isEnabled
      ? this.#swUpdate.versionUpdates.pipe(
          filter((evt) => evt.type === 'VERSION_READY'),
          map(() => true),
        )
      : EMPTY,
    { initialValue: false },
  );

  constructor() {
    if (this.#win && this.#swUpdate.isEnabled) {
      this.#swUpdate.unrecoverable
        .pipe(takeUntilDestroyed(this.#destroyRef$))
        .subscribe(() => this.#win?.location?.reload());

      const isAppStable$ = this.#appRef.isStable.pipe(
        filter((isStable) => isStable),
        take(1),
      );
      const polling$ = interval(this.#pwaCheckInterval);

      concat(isAppStable$, polling$)
        .pipe(
          exhaustMap(() =>
            from(this.#swUpdate.checkForUpdate()).pipe(
              catchError((e) => {
                console.error(e);
                return EMPTY;
              }),
            ),
          ),
          takeUntilDestroyed(this.#destroyRef$),
        )
        .subscribe();
    }
  }

  reloadApp(): void {
    if (this.#win) {
      if (this.#swUpdate.isEnabled) {
        try {
          this.#swUpdate.activateUpdate();
        } catch (error) {
          console.error('Failed to activate service worker update:', error);
        }
      }
      this.#win.location?.reload();
    }
  }
}
