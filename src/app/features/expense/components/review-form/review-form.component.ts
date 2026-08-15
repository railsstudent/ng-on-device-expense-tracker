import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-form',
  imports: [FormsModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
})
export class ReviewFormComponent {
  // Two-way model bindings with implicit type inference
  public readonly merchantName = model('Coffee Roasters Inc.');
  public readonly amount = model(12.5);
  public readonly transactionDate = model('2026-05-14');
  public readonly category = model('dining');

  // Modern output event signal
  public readonly saved = output<{
    merchantName: string;
    amount: number;
    transactionDate: string;
    category: string;
  }>();

  // Loading state for saving simulation
  protected readonly isSaving = signal(false);

  protected readonly categories = [
    { key: 'dining', label: 'Dining & Meals / 餐飲' },
    { key: 'travel', label: 'Travel & Transport / 交通' },
    { key: 'office', label: 'Office & Software / 辦公' },
    { key: 'utilities', label: 'Utilities & Bills / 水電雜費' },
    { key: 'shopping', label: 'Shopping & Entertainment / 購物與娛樂' },
    { key: 'other', label: 'Other / 其他' },
  ];

  protected onSubmit(): void {
    if (!this.merchantName().trim() || this.amount() <= 0 || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    // Simulate saving delay before emitting output
    setTimeout(() => {
      this.isSaving.set(false);
      this.saved.emit({
        merchantName: this.merchantName(),
        amount: this.amount(),
        transactionDate: this.transactionDate(),
        category: this.category(),
      });
    }, 800);
  }
}
