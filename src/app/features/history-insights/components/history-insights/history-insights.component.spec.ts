import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import HistoryInsightsComponent from './history-insights.component';
import { HistoryInsightsService } from './services/history-insights.service';
import { Expense } from '@/shared/interfaces/expense.interface';
import { Insight } from '@/shared/interfaces/insight.interface';
import { InsightsResponse } from '@/shared/interfaces/insights-response.interface';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('HistoryInsightsComponent', () => {
  let fixture: ComponentFixture<HistoryInsightsComponent>;
  let component: HistoryInsightsComponent;

  const mockService = {
    aiStatus: vi.fn().mockReturnValue('ready'),
    aiError: vi.fn().mockReturnValue(null),
    loadExpenses: vi.fn().mockResolvedValue([
      { id: 1, merchantName: 'Starbucks', amount: 8.5, transactionDate: '2026-08-02', category: 'Dining' },
      { id: 2, merchantName: 'Texaco', amount: 45.0, transactionDate: '2026-08-05', category: 'Auto' },
    ]),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
    streamInsights: vi.fn().mockImplementation(async function* () {
      yield {
        insights: [{ title: 'Coffee Spend', message: 'You spent 8.50 on coffee.', type: 'saving' }],
      } as InsightsResponse;
    }),
  };

  beforeEach(async () => {
    if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    }

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HistoryInsightsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(HistoryInsightsComponent, {
        set: {
          providers: [{ provide: HistoryInsightsService, useValue: mockService }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HistoryInsightsComponent);
    component = fixture.componentInstance;
  });

  describe('Component Presentational States', () => {
    it('should initialize with empty states', () => {
      expect(component.expenses().length).toBe(0);
      expect(component.hasSearched()).toBe(false);
      expect(component.aiState().streamingInsights.length).toBe(0);
      expect(component.pendingDeleteExpense()).toBeNull();
    });

    it('should load records and set signals on Search', async () => {
      await component.onSearch({ startDate: '2026-08-01', endDate: '2026-08-10' });

      expect(mockService.loadExpenses).toHaveBeenCalledWith('2026-08-01', '2026-08-10');
      expect(component.expenses().length).toBe(2);
      expect(component.hasSearched()).toBe(true);
      expect(component.aiState().streamingInsights.length).toBe(0);
    });

    it('should open and handle delete confirmations', async () => {
      // Setup initial records
      component.expenses.set([{ id: 1, merchantName: 'Starbucks', amount: 8.5 } as Expense]);

      const target = component.expenses()[0];
      component.openDeleteConfirmation(target);
      expect(component.pendingDeleteExpense()).toEqual(target);

      await component.onDeleteConfirmed();
      expect(mockService.deleteExpense).toHaveBeenCalledWith(1);
      expect(component.expenses().length).toBe(0);
      expect(component.pendingDeleteExpense()).toBeNull();
    });

    it('should clear delete selection on cancel', () => {
      component.pendingDeleteExpense.set({ id: 1 } as Expense);
      component.onDeleteCancelled();
      expect(component.pendingDeleteExpense()).toBeNull();
    });

    it('should call stream service and stream results to UI signal', async () => {
      component.expenses.set([{ id: 1, merchantName: 'Starbucks', amount: 8.5 } as Expense]);

      await component.onAskGemma('check my coffee habits');
      expect(mockService.streamInsights).toHaveBeenCalledWith('check my coffee habits', component.expenses());
      expect(component.aiState().streamingInsights.length).toBe(1);
      expect(component.aiState().streamingInsights[0].title).toBe('Coffee Spend');
    });

    it('should clear previous insights and only display the current query stream results', async () => {
      const initialInsight: Insight = { title: 'First Query', message: 'Original', type: 'saving' };
      component.streamingResponse.set({ insights: [initialInsight] });

      mockService.streamInsights.mockImplementationOnce(async function* () {
        yield { insights: [{ title: 'Second Query', message: 'Step 1', type: 'trend' }] } as InsightsResponse;
        yield {
          insights: [
            { title: 'Second Query', message: 'Step 1', type: 'trend' },
            { title: 'Second Query Done', message: 'Step 2', type: 'saving' },
          ],
        } as InsightsResponse;
      });

      await component.onAskGemma('Tell me more');

      const results = component.aiState().streamingInsights;
      expect(results.length).toBe(2);
      expect(results[0].title).toBe('Second Query');
      expect(results[1].title).toBe('Second Query Done');
    });
  });
});
