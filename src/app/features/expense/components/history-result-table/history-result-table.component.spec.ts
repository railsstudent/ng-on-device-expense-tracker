import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HistoryResultTableComponent } from './history-result-table.component';
import { HistoryResultTableService } from './services/history-result-table.service';
import { Expense } from '@/shared/interfaces/expense.interface';
import { By } from '@angular/platform-browser';

describe('HistoryResultTableComponent', () => {
  let component: HistoryResultTableComponent;
  let fixture: ComponentFixture<HistoryResultTableComponent>;

  const mockExpenses: Expense[] = [
    { id: 1, merchantName: 'Burger King', amount: 15, transactionDate: '2026-08-10', category: 'Dining' },
    { id: 2, merchantName: 'Office Depot', amount: 120, transactionDate: '2026-08-12', category: 'Office' },
    { id: 3, merchantName: 'apple store', amount: 999, transactionDate: '2026-08-01', category: 'Electronics' },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HistoryResultTableComponent],
      providers: [HistoryResultTableService],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryResultTableComponent);
    component = fixture.componentInstance;
  });

  describe('Conditional State Rendering', () => {
    it('should show search prompt when hasSearched is false', () => {
      fixture.componentRef.setInput('expenses', []);
      fixture.componentRef.setInput('hasSearched', false);
      fixture.detectChanges();

      const prompt = fixture.debugElement.query(By.css('.table-empty-desc'));
      expect(prompt.nativeElement.textContent).toContain('請選擇日期範圍以載入交易紀錄');
    });

    it('should show no records message when hasSearched is true but list is empty', () => {
      fixture.componentRef.setInput('expenses', []);
      fixture.componentRef.setInput('hasSearched', true);
      fixture.detectChanges();

      const prompt = fixture.debugElement.query(By.css('.table-empty-desc'));
      expect(prompt.nativeElement.textContent).toContain('此日期範圍內無任何交易紀錄');
    });

    it('should render table rows when hasSearched is true and list has records', () => {
      fixture.componentRef.setInput('expenses', mockExpenses);
      fixture.componentRef.setInput('hasSearched', true);
      fixture.detectChanges();

      const rows = fixture.debugElement.queryAll(By.css('.table-body-row'));
      expect(rows.length).toBe(3);
      expect(rows[0].nativeElement.textContent).toContain('Burger King');
    });
  });

  describe('Sort Actions', () => {
    it('should change sort column and order on clicking sort headers', () => {
      fixture.componentRef.setInput('expenses', mockExpenses);
      fixture.componentRef.setInput('hasSearched', true);
      fixture.detectChanges();

      const headers = fixture.debugElement.queryAll(By.css('.table-header-th, .table-header-th-right'));
      // The first header is Merchant Name
      headers[0].triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.sortState().column).toBe('merchantName');
      expect(component.sortState().direction).toBe('asc');

      // Sort again on same header should transition to desc
      headers[0].triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.sortState().direction).toBe('desc');
    });
  });

  describe('Pagination Navigation', () => {
    it('should update current page when clicking next and prev pagination buttons', () => {
      fixture.componentRef.setInput('expenses', mockExpenses);
      fixture.componentRef.setInput('hasSearched', true);
      component.pageSize.set(2); // 3 items / page size of 2 -> 2 pages
      fixture.detectChanges();

      expect(component.currentPage()).toBe(1);

      const nextButton = fixture.debugElement.query(By.css('button[aria-label="Next Page"]'));
      nextButton.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.currentPage()).toBe(2);

      const prevButton = fixture.debugElement.query(By.css('button[aria-label="Previous Page"]'));
      prevButton.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.currentPage()).toBe(1);
    });

    it('should adjust page size and reset current page on dropdown selection change', () => {
      fixture.componentRef.setInput('expenses', mockExpenses);
      fixture.componentRef.setInput('hasSearched', true);
      component.currentPage.set(2);
      fixture.detectChanges();

      const select = fixture.debugElement.query(By.css('select#pageSize'));
      select.nativeElement.value = '20';
      select.triggerEventHandler('change', { target: select.nativeElement });
      fixture.detectChanges();

      expect(component.pageSize()).toBe(20);
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('Deletion Event Emitting', () => {
    it('should emit deleteRequest output event when row trash icon is clicked', () => {
      const deleteSpy = vi.fn();
      component.deleteRequest.subscribe(deleteSpy);

      fixture.componentRef.setInput('expenses', mockExpenses);
      fixture.componentRef.setInput('hasSearched', true);
      fixture.detectChanges();

      const deleteButtons = fixture.debugElement.queryAll(By.css('button.table-delete-button'));
      expect(deleteButtons.length).toBe(3);

      deleteButtons[0].triggerEventHandler('click', null);
      expect(deleteSpy).toHaveBeenCalledWith(mockExpenses[0]);
    });
  });
});
