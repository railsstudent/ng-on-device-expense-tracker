import { Component, computed, output, signal } from '@angular/core';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from './consts/image-uploader.const';
import { calculateFileSize } from './utils/file.utils';
import { ImageUploaderState } from './interfaces/image-uploader-state.interface';

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.css'],
})
export class ImageUploaderComponent {
  // Output event using modern output signal
  readonly imageSelected = output<string>();

  // Single source of truth writable state signal
  private readonly state = signal<ImageUploaderState>({});

  // State signals derived via clean single-line computed shortcuts
  protected readonly previewUrl = computed(() => this.state().preview);
  protected readonly errorMessage = computed(() => this.state().error);
  protected readonly uploadProgress = computed(() => this.state().progress);
  protected readonly fileSizeText = computed(() => this.state().sizeText);

  // Dragging state remains independent as it is UI interaction state, not file upload state
  protected readonly isDragging = signal(false);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  protected clearPreview(): void {
    this.updateState({});
    this.imageSelected.emit('');
  }

  // Private helper method using standard private modifier
  private processFile(file: File): void {
    // 1. MIME-type validation
    if (!file.type.startsWith('image/')) {
      this.updateState({
        error: 'Only image files (PNG, JPG, WebP) are supported. PDFs or multi-page documents are not supported.',
      });
      return;
    }

    // 2. Size limit validation (20MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeText = calculateFileSize(file);
      this.updateState({
        error: `File is too large (${sizeText}). The maximum allowed size is ${MAX_IMAGE_SIZE_MB}MB.`,
      });
      return;
    }

    // Clear errors & set file size text, ready for FileReader stream
    const sizeText = calculateFileSize(file);
    this.updateState({ sizeText });

    this.addFileReaderEvents(file);
  }

  private addFileReaderEvents(file: File): void {
    const reader = new FileReader();

    // Track when the read starts
    reader.onloadstart = () => {
      // Partially update progress to 0 while keeping sizeText
      this.updateState({ progress: 0, sizeText: this.fileSizeText() });
    };

    // Track chunk progress
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        this.updateState({ progress: percentage, sizeText: this.fileSizeText() });
      }
    };

    reader.onload = () => {
      const result = reader.result as string;
      this.updateState({ preview: result, sizeText: this.fileSizeText() });
      this.imageSelected.emit(result);
    };

    reader.readAsDataURL(file);
  }

  // Unified State Updater setting the single writable state signal
  private updateState(params: ImageUploaderState): void {
    this.state.set(params);
  }
}
