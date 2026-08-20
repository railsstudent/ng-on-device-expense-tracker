import { DatabaseService } from '@/core/services/database.service';
import { ReviewFormComponent } from '@/features/expense/components/review-form/review-form.component';
import { ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { ToastService } from '@/shared/ui/components/toast/services/toast.service';
import { ImageUploaderComponent } from '@/shared/ui/components/image-uploader/image-uploader.component';
import { ModelDownloaderComponent } from '@/shared/ui/components/model-downloader/model-downloader.component';
import { Component, inject, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-extract-expense',
  imports: [ModelDownloaderComponent, ImageUploaderComponent, ReviewFormComponent],
  templateUrl: './extract-expense.component.html',
  styleUrls: ['./extract-expense.component.css'],
})
export class ExtractExpenseComponent {
  readonly #databaseService = inject(DatabaseService);
  readonly #toastService = inject(ToastService);
  private readonly reviewForm = viewChild(ReviewFormComponent);

  // Consolidated read-only extracted state passed to review form
  protected readonly extractedExpense = signal<ExtractedExpense | null>(null);

  // State managing physical database write transactions
  protected readonly isSaving = signal(false);

  // New signal to manage selected image state and manual button enabling (empty string instead of null)
  protected readonly selectedImageBase64 = signal('');

  protected onImageSelected(base64Data: string): void {
    console.log('Action: Image file processed by uploader widget:', base64Data.substring(0, 50) + '...');
    this.selectedImageBase64.set(base64Data);
    // Reset receipt states on a new image drop
    this.extractedExpense.set(null);
  }

  protected async onFormSaved(data: ExtractedExpense): Promise<void> {
    console.log('Action: Save Expense Triggered with validated fields:', data);
    this.isSaving.set(true);
    try {
      await this.#databaseService.insert(data);
      console.log('Action: Expense successfully persisted in IndexedDB.');
      this.#toastService.success('Expense successfully saved!');

      // Reset selected image and extraction states after successful save
      this.selectedImageBase64.set('');
      this.extractedExpense.set(null);

      // Reset the child review form's interaction touched states
      this.reviewForm()?.resetForm();
    } catch (err) {
      console.error('Failed to save expense in IndexedDB:', err);
      this.#toastService.error('Failed to save expense to database.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected onFormCleared(): void {
    console.log('Action: Form clear requested. Resetting parent extraction states.');
    this.selectedImageBase64.set('');
    this.extractedExpense.set(null);
  }
}

export default ExtractExpenseComponent;
