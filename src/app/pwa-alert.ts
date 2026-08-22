import { WINDOW } from '@/core/consts/window.const';
import { PwaService } from '@/core/services/pwa.service';
import { Component, inject, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-pwa-alert',
  template: `
    @if (alertStatus()) {
      <div class="pwa-alert-container">
        <span class="material-symbols-outlined pwa-alert-icon">system_update_alt</span>
        <div class="pwa-alert-text">{{ alertStatus() }}</div>
        <div class="pwa-alert-actions">
          @if (alertStatus() === 'Update Available! Please reload.') {
            <button (click)="reloadApp()" class="pwa-alert-btn-reload">Reload</button>
          }
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
  readonly #pwa = inject(PwaService);
  readonly #window = inject(WINDOW);

  protected readonly alertStatus = linkedSignal(() => this.#pwa.status());

  protected dismissAlert(): void {
    this.alertStatus.set('');
  }

  protected reloadApp(): void {
    this.#window?.location?.reload();
  }
}
