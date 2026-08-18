import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HistoryInsightsService } from './services/history-insights.service';
import { DatabaseService } from '@/core/services/database.service';
import { InsightService } from '@/core/services/ai/insight.service';
import { InsightsResponse } from '@/shared/interfaces/insights-response.interface';

describe('HistoryInsightsService', () => {
  let service: HistoryInsightsService;

  const mockDbService = {
    selectByDateRange: vi
      .fn()
      .mockResolvedValue([
        { id: 1, merchantName: 'Burger King', amount: 15, transactionDate: '2026-08-10', category: 'Dining' },
      ]),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const mockInsightService = {
    status: vi.fn().mockReturnValue('ready'),
    error: vi.fn().mockReturnValue(null),
    streamInsights: vi.fn().mockImplementation(async function* () {
      yield {
        insights: [{ title: 'Trend Found', message: 'Office spending is higher.', type: 'trend' }],
      } as InsightsResponse;
    }),
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        HistoryInsightsService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: InsightService, useValue: mockInsightService },
      ],
    });
    service = TestBed.inject(HistoryInsightsService);
  });

  describe('Stateless DB Queries', () => {
    it('should query expenses via database service by date range', async () => {
      const result = await service.loadExpenses('2026-08-01', '2026-08-15');
      expect(mockDbService.selectByDateRange).toHaveBeenCalledWith('2026-08-01', '2026-08-15');
      expect(result.length).toBe(1);
      expect(result[0].merchantName).toBe('Burger King');
    });

    it('should delete record by id', async () => {
      await service.deleteExpense(42);
      expect(mockDbService.delete).toHaveBeenCalledWith(42);
    });
  });

  describe('Stateless AI Stream Delegating', () => {
    it('should delegate streaming insights call to InsightService', async () => {
      const generator = service.streamInsights('show my dining trends', []);
      const streamResults = [];
      for await (const val of generator) {
        streamResults.push(val);
      }

      expect(mockInsightService.streamInsights).toHaveBeenCalledWith('show my dining trends', []);
      expect(streamResults.length).toBe(1);
      expect(streamResults[0].insights[0].title).toBe('Trend Found');
    });
  });
});
