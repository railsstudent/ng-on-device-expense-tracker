import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { InsightService } from './insight.service';
import { GemmaEngineService } from './gemma-engine.service';
import { Expense } from '@/shared/interfaces/expense.interface';

describe('InsightService', () => {
  let service: InsightService;

  const mockConversation = {
    sendMessage: vi.fn().mockResolvedValue({}),
    sendMessageStreaming: vi.fn().mockImplementation(async function* () {
      yield { content: '{"insights": []}' };
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const mockEngine = {
    createConversation: vi.fn().mockResolvedValue(mockConversation),
  };

  const mockGemmaEngineService = {
    getEngine: vi.fn().mockResolvedValue(mockEngine),
  };

  const dummyExpenses: Expense[] = [
    {
      id: 1,
      merchantName: 'Starbucks',
      amount: 4.5,
      transactionDate: '2026-08-15',
      category: 'dining',
    },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [InsightService, { provide: GemmaEngineService, useValue: mockGemmaEngineService }],
    });
    service = TestBed.inject(InsightService);

    // Reset spies
    mockConversation.sendMessage.mockClear();
    mockConversation.sendMessageStreaming.mockClear();
    mockEngine.createConversation.mockClear();
    mockGemmaEngineService.getEngine.mockClear();
  });

  it('should format expenses to pipe-separated CSV and send priming prompt', async () => {
    // Prime context by triggering first streamInsights
    const generator = service.streamInsights('Show me analytics', dummyExpenses);
    for await (const chunk of generator) {
      expect(chunk).toBeDefined();
    }

    expect(mockGemmaEngineService.getEngine).toHaveBeenCalled();
    expect(mockEngine.createConversation).toHaveBeenCalled();
    expect(mockConversation.sendMessage).toHaveBeenCalled();

    const sentPrimingPrompt = mockConversation.sendMessage.mock.calls[0][0];
    expect(sentPrimingPrompt).toContain('Date|Category|Merchant|Amount');
    expect(sentPrimingPrompt).toContain('2026-08-15|dining|Starbucks|4.50');
  });

  it('should track turns and re-prime automatically after 3 turns with sliding 2-question memory', async () => {
    // Turn 1
    for await (const chunk of service.streamInsights('First query', dummyExpenses)) {
      expect(chunk).toBeDefined();
    }
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1);

    // Turn 2
    for await (const chunk of service.streamInsights('Second query', dummyExpenses)) {
      expect(chunk).toBeDefined();
    }
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1);

    // Turn 3
    for await (const chunk of service.streamInsights('Third query', dummyExpenses)) {
      expect(chunk).toBeDefined();
    }
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1);

    // Reset spies to check re-prime behaviour on Turn 4 (which exceeds 3 active turns threshold)
    mockEngine.createConversation.mockClear();
    mockConversation.sendMessage.mockClear();

    // Turn 4 (Trigger auto reset!)
    for await (const chunk of service.streamInsights('Fourth query', dummyExpenses)) {
      expect(chunk).toBeDefined();
    }
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1); // Auto-recreated!
    expect(mockConversation.sendMessage).toHaveBeenCalled();

    const rePrimingPrompt = mockConversation.sendMessage.mock.calls[0][0];
    expect(rePrimingPrompt).toContain('Second query');
    expect(rePrimingPrompt).toContain('Third query');
    expect(rePrimingPrompt).not.toContain('First query'); // Shifted out of sliding window!
  });

  it('should handle engine initialization failures and allow successful retries once resolved', async () => {
    // 1. Simulate un-cached model weights by forcing getEngine to reject on the first call
    const initError = new Error('Gemma 4 local weights are not cached in the browser yet. Please download them first.');
    mockGemmaEngineService.getEngine.mockRejectedValueOnce(initError);

    // 2. Trigger streamInsights and verify it propagates the error
    const firstGenerator = service.streamInsights('Show me analytics', dummyExpenses);
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of firstGenerator) {
        // No chunks should be yielded on failure
      }
    }).rejects.toThrow('Gemma 4 local weights are not cached');

    // Verify service transitions to a failed state and records the error
    expect(service.status()).toBe('failed');
    expect(service.error()).toBe(initError.message);

    // 3. Subsequent calls should succeed (simulating that the user downloaded the weights and retried)
    const secondGenerator = service.streamInsights('Show me analytics', dummyExpenses);
    for await (const chunk of secondGenerator) {
      expect(chunk).toBeDefined();
    }

    // Verify status recovers to 'ready' and succeeds
    expect(service.status()).toBe('ready');
    expect(service.error()).toBeUndefined();
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1);
    expect(mockConversation.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('should auto-recover from streaming/WebGPU crashes by resetting the broken session state', async () => {
    // 1. Prime and stream successfully on first call
    const firstGenerator = service.streamInsights('Valid query', dummyExpenses);
    for await (const chunk of firstGenerator) {
      expect(chunk).toBeDefined();
    }
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1);

    // 2. Simulate a mid-stream WebGPU device crash during the second query
    const streamError = new Error('WebGPU Device Lost');
    mockConversation.sendMessageStreaming.mockRejectedValueOnce(streamError);

    const secondGenerator = service.streamInsights('Crashed query', dummyExpenses);
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of secondGenerator) {
        // No chunks should be yielded
      }
    }).rejects.toThrow('WebGPU Device Lost');

    // State should now transition to failed and session tracking is cleanly reset
    expect(service.status()).toBe('failed');
    expect(service.error()).toBe(streamError.message);

    // 3. The next query should recognize that the session was reset, re-prime a new conversation, and succeed
    mockEngine.createConversation.mockClear();
    const thirdGenerator = service.streamInsights('Recovery query', dummyExpenses);
    for await (const chunk of thirdGenerator) {
      expect(chunk).toBeDefined();
    }

    // Since the previous crash reset the session, a fresh conversation is successfully created!
    expect(mockEngine.createConversation).toHaveBeenCalledTimes(1);
    expect(service.status()).toBe('ready');
    expect(service.error()).toBeUndefined();
  });
});
