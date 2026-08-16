import { Component, model, output, signal, computed, linkedSignal } from '@angular/core';
import { form, FormField, submit, required, min } from '@angular/forms/signals';

@Component({
  selector: 'app-review-form',
  imports: [FormField],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
})
export class ReviewFormComponent {
  // Two-way model bindings with implicit type inference
  public readonly merchantName = model('Coffee Roasters Inc.');
  public readonly amount = model(12.5);
  public readonly transactionDate = model('2026-05-14');
  public readonly category = model('dining');
  public readonly isReceipt = model(false);
  public readonly hasExtracted = model(false);

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

  // Private inputs source that triggers resetting on change (single-line arrow shortcut)
  readonly #inputsSource = computed(() => ({
    merchantName: this.merchantName(),
    amount: this.amount(),
    transactionDate: this.transactionDate(),
    category: this.category(),
  }));

  // Create formModel as a linkedSignal (single-line arrow shortcut)
  protected readonly formModel = linkedSignal(() => this.#inputsSource());

  // Define verificationForm using Signal Forms with validation rules
  protected readonly verificationForm = form(this.formModel, (s) => {
    required(s.merchantName, { message: 'Merchant name is required' });
    required(s.amount, { message: 'Amount is required' });
    min(s.amount, 0.01, { message: 'Amount must be greater than zero' });
    required(s.transactionDate, { message: 'Transaction date is required' });
    required(s.category, { message: 'Category is required' });
  });

  protected onSubmit(): void {
    submit(this.verificationForm, async () => {
      this.isSaving.set(true);
      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });
      this.isSaving.set(false);
      this.saved.emit(this.formModel());
    });
  }
}
