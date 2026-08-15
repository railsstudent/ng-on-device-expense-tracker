import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUploaderComponent } from './image-uploader.component';
import { MAX_IMAGE_SIZE_BYTES, SIZE_KB, SIZE_MB } from './consts/image-uploader.const';
import { calculateFileSize } from './utils/file.utils';

describe('ImageUploaderComponent', () => {
  let component: ImageUploaderComponent;
  let fixture: ComponentFixture<ImageUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUploaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the image uploader component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate file sizes correctly using calculateFileSize utility', () => {
    const smallFile = new File([''], 'small.png', { type: 'image/png' });
    Object.defineProperty(smallFile, 'size', { value: 50 * SIZE_KB });
    expect(calculateFileSize(smallFile)).toBe('50.0 KB');

    const largeFile = new File([''], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 4.5 * SIZE_MB });
    expect(calculateFileSize(largeFile)).toBe('4.50 MB');
  });

  it('should encapsulate states correctly inside updateState method', () => {
    component['updateState']({
      preview: 'data:image/png;base64,...',
      progress: 45,
      error: 'error text',
      sizeText: '4.50 MB',
    });

    expect(component['previewUrl']()).toBe('data:image/png;base64,...');
    expect(component['uploadProgress']()).toBe(45);
    expect(component['errorMessage']()).toBe('error text');
    expect(component['fileSizeText']()).toBe('4.50 MB');
  });

  it('should reject non-image files and set an error message (Validation Seam)', () => {
    const mockFile = new File(['%PDF-1.4...'], 'receipt.pdf', { type: 'application/pdf' });
    component['processFile'](mockFile);

    expect(component['errorMessage']()).toContain('Only image files (PNG, JPG, WebP) are supported');
    expect(component['previewUrl']()).toBeUndefined();
  });

  it('should reject images exceeding the 20MB limit (Size Validation Seam)', () => {
    const hugeFile = new File([''], 'huge_photo.png', { type: 'image/png' });
    Object.defineProperty(hugeFile, 'size', { value: MAX_IMAGE_SIZE_BYTES + 1 });

    component['processFile'](hugeFile);

    expect(component['errorMessage']()).toContain('File is too large');
    expect(component['errorMessage']()).toContain('The maximum allowed size is 20MB');
    expect(component['previewUrl']()).toBeUndefined();
  });

  it('should accept valid image files and clear error messages (Image Load Seam)', () => {
    component['updateState']({ error: 'Some old error' });
    const mockFile = new File(['fake-image-binary-data'], 'receipt.png', { type: 'image/png' });

    const spyReader = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      if (this.onloadstart) {
        this.onloadstart({} as ProgressEvent<FileReader>);
      }
      if (this.onprogress) {
        Object.defineProperty(this, 'onprogress', { value: this.onprogress });
        this.onprogress({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent<FileReader>);
      }
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    });

    component['processFile'](mockFile);

    expect(component['errorMessage']()).toBeUndefined();
    expect(component['uploadProgress']()).toBeUndefined();
    spyReader.mockRestore();
  });
});
