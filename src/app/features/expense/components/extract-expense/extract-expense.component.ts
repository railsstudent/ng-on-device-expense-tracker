import { ReviewFormComponent } from '@/features/expense/components/review-form/review-form.component';
import { ImageUploaderComponent } from '@/shared/ui/components/image-uploader/image-uploader.component';
import { ModelDownloaderComponent } from '@/shared/ui/components/model-downloader/model-downloader.component';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-extract-expense',
  imports: [ModelDownloaderComponent, ImageUploaderComponent, ReviewFormComponent],
  templateUrl: './extract-expense.component.html',
  styleUrls: ['./extract-expense.component.css'],
})
export class ExtractExpenseComponent {
  // Bidirectional sync fields with implicit signal types
  protected readonly merchantName = signal('Coffee Roasters Inc.');
  protected readonly amount = signal(12.5);
  protected readonly transactionDate = signal('2026-05-14');
  protected readonly selectedCategory = signal('dining');

  // New signal to manage selected image state and manual button enabling
  protected readonly selectedImageBase64 = signal<string | null>(null);

  protected onImageSelected(base64Data: string): void {
    console.log('Action: Image file processed by uploader widget:', base64Data.substring(0, 50) + '...');
    this.selectedImageBase64.set(base64Data);
  }

  protected triggerLocalOcr(): void {
    if (!this.selectedImageBase64()) {
      return;
    }
    console.log('Action: Manual OCR extraction triggered.');
    // Simulated OCR extraction response triggers
    this.merchantName.set('Gemma Brew House');
    this.amount.set(8.75);
    this.transactionDate.set(new Date().toISOString().split('T')[0]);
    this.selectedCategory.set('dining');
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
    // Reset selected image after successful save
    this.selectedImageBase64.set(null);
  }
}

export default ExtractExpenseComponent;
