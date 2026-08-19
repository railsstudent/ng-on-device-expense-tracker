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
});
