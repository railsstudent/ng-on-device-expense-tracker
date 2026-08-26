import { inject, Service, signal } from '@angular/core';
import { ToastMessage, ToastType } from '@/shared/interfaces/toast.interface';
import { IS_BROWSER } from '@/core/consts/window.const';
import { timer } from 'rxjs';

@Service()
export class ToastService {
  readonly #isBrowser = inject(IS_BROWSER);
  readonly #toasts = signal<ToastMessage[]>([]);
  readonly toasts = this.#toasts.asReadonly();
  #nextId = 1;

  show(message: string, type: ToastType = 'info', duration = 3000): void {
    const id = this.#nextId;
    this.#nextId = this.#nextId + 1; // Explicit arithmetic assignment

    const newToast: ToastMessage = { id, message, type, duration };
    this.#toasts.update((current) => [...current, newToast]);

    if (duration > 0 && this.#isBrowser) {
      timer(duration).subscribe(() => this.remove(id));
    }
  }

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  remove(id: number): void {
    this.#toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
