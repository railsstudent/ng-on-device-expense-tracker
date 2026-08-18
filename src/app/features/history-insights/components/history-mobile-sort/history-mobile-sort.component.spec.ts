import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryMobileSortComponent } from './history-mobile-sort.component';
import { TableSortState, HeaderConfig } from '@/features/history-insights/interfaces/history-insights-state.interface';

describe('HistoryMobileSortComponent', () => {
  let component: HistoryMobileSortComponent;
  let fixture: ComponentFixture<HistoryMobileSortComponent>;

  const mockHeaders: HeaderConfig[] = [
    { key: 'merchantName', label: 'Merchant / 商家' },
    { key: 'amount', label: 'Amount / 金額' },
    { key: 'transactionDate', label: 'Date / 交易日期' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryMobileSortComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryMobileSortComponent);
    component = fixture.componentInstance;

    // Set required input signal for dynamic sorting list single-source-of-truth
    fixture.componentRef.setInput('headers', mockHeaders);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit correct TableSortState when a sort option is selected', () => {
    let emittedState: TableSortState | null = null;
    component.sortChange.subscribe((state) => {
      emittedState = state;
    });

    const selectEl = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    selectEl.value = 'amount-desc';
    selectEl.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    expect(emittedState).toEqual({ column: 'amount', direction: 'desc' });
  });

  it('should emit empty/none TableSortState when default option is selected', () => {
    let emittedState: TableSortState | null = null;
    component.sortChange.subscribe((state) => {
      emittedState = state;
    });

    const selectEl = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    selectEl.value = '';
    selectEl.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    expect(emittedState).toEqual({ column: '', direction: 'none' });
  });
});
