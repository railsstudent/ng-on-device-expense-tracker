import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ModelDownloaderService } from './model-downloader.service';
import { AiModelCacheService } from '@/core/services/ai/ai-model-cache.service';
import { NAVIGATOR } from '@/core/consts/window.const';

vi.mock('@/assets/FileProxyCache.min.js', () => ({
  default: class {},
}));

describe('ModelDownloaderService', () => {
  let mockCacheService: {
    status: WritableSignal<string>;
    progress: WritableSignal<number>;
    downloadModel: () => Promise<string>;
  };
  let mockNavigator: { onLine: boolean };

  beforeEach(() => {
    mockCacheService = {
      status: signal('not_downloaded'),
      progress: signal(0),
      downloadModel: vi.fn().mockResolvedValue('blob-url'),
    };
    mockNavigator = { onLine: true };
  });

  function createService(): ModelDownloaderService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ModelDownloaderService,
        { provide: AiModelCacheService, useValue: mockCacheService },
        { provide: NAVIGATOR, useValue: mockNavigator },
      ],
    });
    return TestBed.inject(ModelDownloaderService);
  }

  describe('Connectivity State Seam', () => {
    it('should compute isOnline correctly based on injected NAVIGATOR', () => {
      mockNavigator.onLine = true;
      const serviceOnline = createService();
      expect(serviceOnline.isOnline()).toBe(true);

      mockNavigator.onLine = false;
      const serviceOffline = createService();
      expect(serviceOffline.isOnline()).toBe(false);
    });
  });

  describe('Caching State Seams', () => {
    it('should compute isCached correctly when model status is cached', () => {
      const service = createService();
      expect(service.isCached()).toBe(false);

      mockCacheService.status.set('cached');
      expect(service.isCached()).toBe(true);
    });

    it('should compute isDownloading correctly when model status is downloading', () => {
      const service = createService();
      expect(service.isDownloading()).toBe(false);

      mockCacheService.status.set('downloading');
      expect(service.isDownloading()).toBe(true);
    });
  });

  describe('Button Disable Logical Seam', () => {
    it('should disable download button when offline and not cached', () => {
      mockNavigator.onLine = false;
      mockCacheService.status.set('not_downloaded');
      const service = createService();
      expect(service.isDownloadDisabled()).toBe(true);
    });

    it('should enable download button when online and not cached', () => {
      mockNavigator.onLine = true;
      mockCacheService.status.set('not_downloaded');
      const service = createService();
      expect(service.isDownloadDisabled()).toBe(false);
    });

    it('should enable download button when offline but already cached', () => {
      mockNavigator.onLine = false;
      mockCacheService.status.set('cached');
      const service = createService();
      expect(service.isDownloadDisabled()).toBe(false);
    });
  });

  describe('Action Delegation Seam', () => {
    it('should delegate downloadModel requests directly to underlying cache layer', async () => {
      const service = createService();
      const result = await service.downloadModel();
      expect(result).toBe('blob-url');
      expect(mockCacheService.downloadModel).toHaveBeenCalled();
    });
  });
});
