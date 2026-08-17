import { Expense } from '@/shared/interfaces/expense.interface';
import { HeaderConfig, TableSortState } from '@/shared/interfaces/history-insights-state.interface';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { HistoryResultTableService } from './services/history-result-table.service';
import { HistoryMobileSortComponent } from '@/features/expense/components/history-mobile-sort/history-mobile-sort.component';

@Component({
  selector: 'app-history-result-table',
  imports: [CurrencyPipe, HistoryMobileSortComponent],
  templateUrl: './history-result-table.component.html',
  styleUrls: ['./history-result-table.component.css'],
})
export class HistoryResultTableComponent {
  readonly #tableService = inject(HistoryResultTableService);

  // Pure data input; table state, paging, and sorting are completely encapsulated internally
  public readonly expenses = input.required<Expense[]>();
  public readonly hasSearched = input.required<boolean>();

  public readonly deleteRequest = output<Expense>();

  public readonly pageSizes = [5, 10, 20, 50];

  public readonly headers: HeaderConfig[] = [
    { key: 'merchantName', label: 'Merchant / 商家' },
    { key: 'amount', label: 'Amount / 金額', alignRight: true },
    { key: 'transactionDate', label: 'Date / 交易日期' },
    { key: 'category', label: 'Category / 類別' },
  ];

  // Local state signal for coupled sorting parameters
  public readonly sortState = signal<TableSortState>({ column: '', direction: 'none' });

  // Local state signal for page size
  public readonly pageSize = signal(10);

  // Derive and sort expenses internally (Rule 5)
  public readonly sortedExpenses = computed(() => this.#tableService.sortExpenses(this.expenses(), this.sortState()));

  // Derived properties for template
  public readonly totalCount = computed(() => this.sortedExpenses().length);
  public readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  // Use state-of-the-art linkedSignal to self-correct/clamp the active currentPage when records or page sizes change
  public readonly currentPage = linkedSignal<{ count: number; size: number }, number>({
    source: () => ({ count: this.totalCount(), size: this.pageSize() }),
    computation: (source, previous) => {
      if (!previous) {
        return 1;
      }
      const maxPages = Math.max(1, Math.ceil(source.count / source.size));
      return Math.min(previous.value, maxPages);
    },
  });

  public readonly paginatedExpenses = computed(() =>
    this.#tableService.paginateExpenses(this.sortedExpenses(), this.pageSize(), this.currentPage()),
  );

  public readonly itemRangeLabel = computed(() =>
    this.#tableService.getItemRangeLabel(this.currentPage(), this.pageSize(), this.totalCount()),
  );

  // Pre-computed dictionary map of column sort icons to prevent unnecessary cycle evaluations in template (Rule 5)
  public readonly sortIcons = computed(() => this.#tableService.getSortIconMap(this.sortState()));

  protected onSort(col: keyof Expense): void {
    const current = this.sortState();

    if (current.column === col) {
      const nextDir = this.#tableService.getNextSortDirection(current.direction);
      this.sortState.set({
        column: nextDir === 'none' ? '' : col,
        direction: nextDir,
      });
    } else {
      this.sortState.set({
        column: col,
        direction: 'asc',
      });
    }
  }

  protected onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(+target.value);
    this.currentPage.set(1);
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
}
