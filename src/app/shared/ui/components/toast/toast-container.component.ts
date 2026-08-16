import { Component, inject } from '@angular/core';
import { ToastService } from '@/shared/ui/components/toast/services/toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  imports: [NgClass],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected removeToast(id: number): void {
    this.toastService.remove(id);
  }
}
