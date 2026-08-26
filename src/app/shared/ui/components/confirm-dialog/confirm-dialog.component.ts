import { Component, ElementRef, viewChild, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent {
  private readonly dialogElement = viewChild<ElementRef<HTMLDialogElement>>('nativeDialog');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  open(): void {
    this.dialogElement()?.nativeElement.showModal();
  }

  close(): void {
    this.dialogElement()?.nativeElement.close();
  }

  confirm(): void {
    this.confirmed.emit();
    this.close();
  }

  cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  onClose(event: Event): void {
    // Prevent the default browser native close to ensure our cancelled event is emitted cleanly
    event.preventDefault();
    this.cancel();
  }
}
