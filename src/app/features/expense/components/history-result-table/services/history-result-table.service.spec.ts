import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { HistoryResultTableService } from './history-result-table.service';
import { Expense } from '@/shared/interfaces/expense.interface';

describe('HistoryResultTableService', () => {
  let service: HistoryResultTableService;

  const mockExpenses: Expense[] = [
    { id: 1, merchantName: 'Burger King', amount: 15, transactionDate: '2026-08-10', category: 'Dining' },
    { id: 2, merchantName: 'Office Depot', amount: 120, transactionDate: '2026-08-12', category: 'Office' },
    { id: 3, merchantName: 'apple store', amount: 999, transactionDate: '2026-08-01', category: 'Electronics' },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [HistoryResultTableService],
    });
    service = TestBed.inject(HistoryResultTableService);
  });

  describe('sortExpenses', () => {
    it('should return unmodified list if column is empty or direction is none', () => {
      const resultEmpty = service.sortExpenses(mockExpenses, { column: '', direction: 'asc' });
      expect(resultEmpty).toEqual(mockExpenses);

      const resultNone = service.sortExpenses(mockExpenses, { column: 'amount', direction: 'none' });
      expect(resultNone).toEqual(mockExpenses);
    });

    it('should sort strings case-insensitively ascending and descending', () => {
      // Ascending: apple store (a) -> Burger King (b) -> Office Depot (o)
      const ascResult = service.sortExpenses(mockExpenses, { column: 'merchantName', direction: 'asc' });
      expect(ascResult[0].merchantName).toBe('apple store');
      expect(ascResult[1].merchantName).toBe('Burger King');
      expect(ascResult[2].merchantName).toBe('Office Depot');

      // Descending: Office Depot -> Burger King -> apple store
      const descResult = service.sortExpenses(mockExpenses, { column: 'merchantName', direction: 'desc' });
      expect(descResult[0].merchantName).toBe('Office Depot');
      expect(descResult[1].merchantName).toBe('Burger King');
      expect(descResult[2].merchantName).toBe('apple store');
    });

    it('should sort numbers ascending and descending', () => {
      // Ascending: 15 -> 120 -> 999
      const ascResult = service.sortExpenses(mockExpenses, { column: 'amount', direction: 'asc' });
      expect(ascResult[0].amount).toBe(15);
      expect(ascResult[1].amount).toBe(120);
      expect(ascResult[2].amount).toBe(999);

      // Descending: 999 -> 120 -> 15
      const descResult = service.sortExpenses(mockExpenses, { column: 'amount', direction: 'desc' });
      expect(descResult[0].amount).toBe(999);
      expect(descResult[1].amount).toBe(120);
      expect(descResult[2].amount).toBe(15);
    });
  });

  describe('paginateExpenses', () => {
    it('should extract correct page slices of expenses', () => {
      const page1 = service.paginateExpenses(mockExpenses, 2, 1);
      expect(page1.length).toBe(2);
      expect(page1[0].id).toBe(1);
      expect(page1[1].id).toBe(2);

      const page2 = service.paginateExpenses(mockExpenses, 2, 2);
      expect(page2.length).toBe(1);
      expect(page2[0].id).toBe(3);
    });
  });

  describe('getNextSortDirection', () => {
    it('should cycle sort direction states in none -> asc -> desc -> none order', () => {
      expect(service.getNextSortDirection('none')).toBe('asc');
      expect(service.getNextSortDirection('asc')).toBe('desc');
      expect(service.getNextSortDirection('desc')).toBe('none');
    });
  });

  describe('getSortIconMap', () => {
    it('should default all headers to unfold_more icon when sorting is none', () => {
      const icons = service.getSortIconMap({ column: '', direction: 'none' });
      expect(icons.merchantName).toBe('unfold_more');
      expect(icons.amount).toBe('unfold_more');
    });

    it('should assign expand_less for active asc sorted column and unfold_more for others', () => {
      const icons = service.getSortIconMap({ column: 'amount', direction: 'asc' });
      expect(icons.amount).toBe('expand_less');
      expect(icons.merchantName).toBe('unfold_more');
    });

    it('should assign expand_more for active desc sorted column and unfold_more for others', () => {
      const icons = service.getSortIconMap({ column: 'merchantName', direction: 'desc' });
      expect(icons.merchantName).toBe('expand_more');
      expect(icons.amount).toBe('unfold_more');
    });
  });

  describe('getItemRangeLabel', () => {
    it('should return 0-0 if totalCount is zero', () => {
      expect(service.getItemRangeLabel(1, 10, 0)).toBe('0–0');
    });

    it('should return correct ranges for standard full pages', () => {
      expect(service.getItemRangeLabel(1, 10, 25)).toBe('1–10');
      expect(service.getItemRangeLabel(2, 10, 25)).toBe('11–20');
    });

    it('should return correct ranges clamped to totalCount for partial final pages', () => {
      expect(service.getItemRangeLabel(3, 10, 25)).toBe('21–25');
    });
  });
});
