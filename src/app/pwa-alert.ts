import { PwaService } from '@/core/services/pwa.service';
import { Component, inject, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-pwa-alert',
  template: `
    @if (updateAvailable() && !isDismissed()) {
      <div class="pwa-alert-container">
        <span class="material-symbols-outlined pwa-alert-icon">system_update_alt</span>
        <div class="pwa-alert-text">New version</div>
        <div class="pwa-alert-actions">
          <button (click)="reloadApp()" class="pwa-alert-btn-reload" aria-label="Reload">Reload</button>
          <button (click)="dismissAlert()" class="pwa-alert-btn-dismiss" aria-label="Dismiss">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './pwa-alert.css',
})
export class PwaAlertComponent {
  readonly #pwaService = inject(PwaService);

  readonly updateAvailable = this.#pwaService.updateAvailable;
  readonly isDismissed = linkedSignal({
    source: this.updateAvailable,
    computation: () => false,
  });

  dismissAlert(): void {
    this.isDismissed.set(true);
  }

  reloadApp(): void {
    this.#pwaService.reloadApp();
  }
}
