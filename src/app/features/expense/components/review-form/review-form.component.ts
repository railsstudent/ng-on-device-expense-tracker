import { Component, input, output, computed, linkedSignal } from '@angular/core';
import { form, FormField, submit, required, min } from '@angular/forms/signals';
import { ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { EXPENSE_CATEGORIES } from '@/shared/constants/category.constants';

@Component({
  selector: 'app-review-form',
  imports: [FormField],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
})
export class ReviewFormComponent {
  // Enforce compile-time parent binding contract
  public readonly initialData = input.required<ExtractedExpense | null>();

  // State driven strictly by parent database save cycle
  public readonly isSaving = input(false);

  // Modern output emitting the domain-specific ExtractedExpense type
  public readonly saved = output<ExtractedExpense>();

  // Centralized single-source-of-truth categories list
  protected readonly categories = EXPENSE_CATEGORIES;

  // Create formModel as a linkedSignal directly from initialData (single-line implicit return)
  protected readonly formModel = linkedSignal(() => ({
    merchantName: this.initialData()?.merchantName || '',
    amount: this.initialData()?.amount || 0,
    transactionDate: this.initialData()?.transactionDate || '',
    category: this.initialData()?.category || 'dining',
  }));

  // Simple layout computations (single-line arrow shortcuts)
  protected readonly hasExtracted = computed(() => this.initialData() !== null);
  protected readonly isReceipt = computed(() => this.initialData()?.isReceipt ?? false);

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
      this.saved.emit(this.formModel());
    });
  }
}
