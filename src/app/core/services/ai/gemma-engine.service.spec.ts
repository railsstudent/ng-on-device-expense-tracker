import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { GemmaEngineService } from '@/core/services/ai/gemma-engine.service';
import { AiModelCacheService } from '@/core/services/ai/ai-model-cache.service';
import { Engine } from '@litert-lm/core';

vi.mock('@litert-lm/core');

describe('GemmaEngineService', () => {
  let service: GemmaEngineService;

  const mockCacheService = {
    getModelUrl: vi.fn(),
  };

  const mockEngineInstance = {
    delete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GemmaEngineService, { provide: AiModelCacheService, useValue: mockCacheService }],
    });

    service = TestBed.inject(GemmaEngineService);

    vi.clearAllMocks();
    mockCacheService.getModelUrl.mockReset();
    mockEngineInstance.delete.mockClear();

    // Default mock implementation for Engine.create
    vi.mocked(Engine.create).mockResolvedValue(mockEngineInstance as unknown as Engine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should successfully load and initialize engine when model is cached', async () => {
    mockCacheService.getModelUrl.mockResolvedValue('blob:http://localhost/gemma4');

    const engine = await service.getEngine();
    expect(engine).toBe(mockEngineInstance as unknown as Engine);
    expect(mockCacheService.getModelUrl).toHaveBeenCalledTimes(1);
    expect(Engine.create).toHaveBeenCalledWith({
      model: 'blob:http://localhost/gemma4',
      mainExecutorSettings: {
        maxNumTokens: 4096,
      },
    });
  });

  it('should return the same cached promise when getEngine is called concurrently', async () => {
    mockCacheService.getModelUrl.mockResolvedValue('blob:http://localhost/gemma4');

    const [engine1, engine2] = await Promise.all([service.getEngine(), service.getEngine()]);

    expect(engine1).toBe(mockEngineInstance as unknown as Engine);
    expect(engine2).toBe(mockEngineInstance as unknown as Engine);
    expect(mockCacheService.getModelUrl).toHaveBeenCalledTimes(1);
    expect(Engine.create).toHaveBeenCalledTimes(1);
  });

  it('should reset the initialization promise and throw error when weights are not cached yet', async () => {
    mockCacheService.getModelUrl.mockResolvedValue(null);

    await expect(service.getEngine()).rejects.toThrow(
      'Gemma 4 local weights are not cached in the browser yet. Please download them first.',
    );

    mockCacheService.getModelUrl.mockResolvedValue('blob:http://localhost/gemma4');
    const engine = await service.getEngine();
    expect(engine).toBe(mockEngineInstance as unknown as Engine);
    expect(mockCacheService.getModelUrl).toHaveBeenCalledTimes(2);
  });

  it('should clean up engine resources on deleteEngine', async () => {
    mockCacheService.getModelUrl.mockResolvedValue('blob:http://localhost/gemma4');

    const engine = await service.getEngine();
    expect(engine).toBe(mockEngineInstance as unknown as Engine);

    await service.deleteEngine();
    expect(mockEngineInstance.delete).toHaveBeenCalledTimes(1);

    const engine2 = await service.getEngine();
    expect(engine2).toBe(mockEngineInstance as unknown as Engine);
    expect(mockCacheService.getModelUrl).toHaveBeenCalledTimes(2);
  });
});
