import { ReviewFormComponent } from '@/features/expense/components/review-form/review-form.component';
import { ImageUploaderComponent } from '@/shared/ui/components/image-uploader/image-uploader.component';
import { ModelDownloaderComponent } from '@/shared/ui/components/model-downloader/model-downloader.component';
import { Component, signal, inject } from '@angular/core';
import { ReceiptAnalyzerService } from '@/core/services/ai/receipt-analyzer.service';

@Component({
  selector: 'app-extract-expense',
  imports: [ModelDownloaderComponent, ImageUploaderComponent, ReviewFormComponent],
  templateUrl: './extract-expense.component.html',
  styleUrls: ['./extract-expense.component.css'],
})
export class ExtractExpenseComponent {
  readonly #analyzerService = inject(ReceiptAnalyzerService);

  // Bidirectional sync fields with implicit signal types
  protected readonly merchantName = signal('');
  protected readonly amount = signal(0);
  protected readonly transactionDate = signal('');
  protected readonly selectedCategory = signal('dining');

  // Tracks if the analysed file was classified as a valid receipt
  protected readonly isReceipt = signal(false);

  // Tracks if a manual extraction has been run on the current image
  protected readonly hasExtracted = signal(false);

  // New signal to manage selected image state and manual button enabling (empty string instead of null)
  protected readonly selectedImageBase64 = signal('');

  // Expose underlying AI model service states reactively with clean direct assignments
  protected readonly isProcessing = this.#analyzerService.isProcessing;
  protected readonly statusText = this.#analyzerService.statusText;

  protected onImageSelected(base64Data: string): void {
    console.log('Action: Image file processed by uploader widget:', base64Data.substring(0, 50) + '...');
    this.selectedImageBase64.set(base64Data);
    // Reset receipt states on a new image drop
    this.isReceipt.set(false);
    this.hasExtracted.set(false);
  }

  protected async triggerLocalOcr(): Promise<void> {
    const base64Data = this.selectedImageBase64();
    if (!base64Data || this.isProcessing()) {
      return;
    }

    console.log('Action: Manual OCR extraction triggered.');
    try {
      const result = await this.#analyzerService.analyzeReceipt(base64Data);
      
      // Update form signals with extracted metadata
      this.merchantName.set(result.merchantName);
      this.amount.set(result.amount);
      this.transactionDate.set(result.transactionDate);
      
      // Map category back to standard English dropdown taxonomy keys
      const categoryMap: Record<string, string> = {
        'Food': 'dining',
        'Groceries': 'shopping',
        'Transport': 'travel',
        'Entertainment': 'shopping',
        'Shopping': 'shopping',
        'Utilities': 'utilities',
        'Medical': 'other',
        'Others': 'other'
      };
      
      const mappedCategory = categoryMap[result.category] || 'other';
      this.selectedCategory.set(mappedCategory);
      
      // Bind states to trigger slide-in warn warnings if false and completed
      this.isReceipt.set(result.isReceipt ?? false);
      this.hasExtracted.set(true);
    } catch (err) {
      console.error('Error during OCR extraction pipeline:', err);
    }
  }

  protected onFormSaved(data: {
    merchantName: string;
    amount: number;
    transactionDate: string;
    category: string;
  }): void {
    console.log('Action: Save Expense Triggered with validated fields:', data);
    alert(
      `Success! Saved local expense:\nMerchant: ${data.merchantName}\nAmount: $${data.amount}\nCategory: ${data.category}`,
    );
    // Reset selected image and extraction states after successful save
    this.selectedImageBase64.set('');
    this.isReceipt.set(false);
    this.hasExtracted.set(false);
  }
}

export default ExtractExpenseComponent;
