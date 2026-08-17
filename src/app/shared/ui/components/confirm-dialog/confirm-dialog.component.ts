import { Component, ElementRef, viewChild, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent {
  private readonly dialogElement = viewChild<ElementRef<HTMLDialogElement>>('nativeDialog');

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();

  public open(): void {
    this.dialogElement()?.nativeElement.showModal();
  }

  public close(): void {
    this.dialogElement()?.nativeElement.close();
  }

  public confirm(): void {
    this.confirmed.emit();
    this.close();
  }

  public cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  public onClose(event: Event): void {
    // Prevent the default browser native close to ensure our cancelled event is emitted cleanly
    event.preventDefault();
    this.cancel();
  }
}
