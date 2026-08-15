import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ModelDownloaderComponent } from './model-downloader.component';
import { ModelDownloaderService } from './model-downloader.service';

describe('ModelDownloaderComponent', () => {
  let component: ModelDownloaderComponent;
  let fixture: ComponentFixture<ModelDownloaderComponent>;
  let mockService: {
    isCached: WritableSignal<boolean>;
    isDownloading: WritableSignal<boolean>;
    progress: WritableSignal<number>;
    isDownloadDisabled: WritableSignal<boolean>;
    downloadText: WritableSignal<string>;
    downloadModel: () => Promise<string>;
  };

  beforeEach(async () => {
    mockService = {
      isCached: signal(false),
      isDownloading: signal(false),
      progress: signal(0),
      isDownloadDisabled: signal(false),
      downloadText: signal('0% downloaded'),
      downloadModel: vi.fn().mockResolvedValue('blob-url'),
    };

    await TestBed.configureTestingModule({
      imports: [ModelDownloaderComponent],
      providers: [{ provide: ModelDownloaderService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelDownloaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the model downloader component', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate download requests when startDownload is clicked', () => {
    component['startDownload']();
    expect(mockService.downloadModel).toHaveBeenCalled();
  });

  it('should block concurrent downloads if already downloading', () => {
    mockService.isDownloading.set(true);
    fixture.detectChanges();
    component['startDownload']();
    expect(mockService.downloadModel).not.toHaveBeenCalled();
  });
});
