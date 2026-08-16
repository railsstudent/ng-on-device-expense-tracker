import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HistoryInsightsService } from './history-insights.service';
import { DatabaseService } from '@/core/services/database.service';
import { InsightService } from '@/core/services/ai/insight.service';
import { Expense } from '@/shared/interfaces/expense.interface';
import { Insight } from '@/shared/interfaces/insight.interface';

describe('HistoryInsightsService', () => {
  let service: HistoryInsightsService;

  const mockDbService = {
    selectByDateRange: vi.fn().mockResolvedValue([
      { id: 1, merchantName: 'Burger King', amount: 15, transactionDate: '2026-08-10', category: 'Dining' },
      { id: 2, merchantName: 'Office Depot', amount: 120, transactionDate: '2026-08-12', category: 'Office' },
    ]),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const mockInsightService = {
    status: vi.fn().mockReturnValue('ready'),
    error: vi.fn().mockReturnValue(null),
    streamInsights: vi.fn().mockImplementation(async function* () {
      yield [{ title: 'Trend Found', message: 'Office spending is higher.', type: 'trend' }] as Insight[];
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

  describe('Form Initialization', () => {
    it('should initialize with empty date values', () => {
      expect(service.formModel().startDate).toBe('');
      expect(service.formModel().endDate).toBe('');
    });

    it('should show form as invalid when empty', () => {
      expect(service.searchForm().invalid()).toBe(true);
    });
  });

  describe('Record Deletion', () => {
    beforeEach(async () => {
      service.formModel.set({ startDate: '2026-08-01', endDate: '2026-08-15' });
      await service.onSearch();
    });

    it('should delete a selected expense record and update the list', async () => {
      const targetExpense = service.expenses()[0];
      service.pendingDeleteExpense.set(targetExpense);

      await service.onDeleteConfirmed();
      expect(mockDbService.delete).toHaveBeenCalledWith(targetExpense.id);
      expect(service.expenses().length).toBe(1);
      expect(service.pendingDeleteExpense()).toBeNull();
    });

    it('should clear pendingDeleteExpense state on delete cancel', () => {
      service.pendingDeleteExpense.set({ id: 1 } as Expense);
      service.onDeleteCancelled();
      expect(service.pendingDeleteExpense()).toBeNull();
    });
  });

  describe('AI Query & Stream Handling', () => {
    it('should reject safe but off-topic prompts', async () => {
      service.aiQuery.set('who won the world cup?');
      await service.onAskGemma();
      expect(service.isQueryUnsafe()).toBe(true);
      expect(service.streamingInsights()).toEqual([]);
    });

    it('should stream insights on-demand for relevant prompts', async () => {
      service.formModel.set({ startDate: '2026-08-01', endDate: '2026-08-15' });
      await service.onSearch();

      service.aiQuery.set('show my dining trends');
      await service.onAskGemma();

      expect(service.isQueryUnsafe()).toBe(false);
      expect(service.streamingInsights().length).toBe(1);
      expect(service.streamingInsights()[0].title).toBe('Trend Found');
    });
  });
});
