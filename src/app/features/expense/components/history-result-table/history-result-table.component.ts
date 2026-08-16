import { Expense } from '@/shared/interfaces/expense.interface';
import {
  LedgerTableState,
  PageChangeEvent,
  PageSizeChangeEvent,
  SortChangeEvent,
  TableSortState,
} from '@/shared/interfaces/history-insights-state.interface';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HistoryResultTableService } from './services/history-result-table.service';

@Component({
  selector: 'app-history-result-table',
  imports: [CurrencyPipe],
  templateUrl: './history-result-table.component.html',
  styleUrls: ['./history-result-table.component.css'],
})
export class HistoryResultTableComponent {
  readonly #tableService = inject(HistoryResultTableService);

  public readonly state = input.required<LedgerTableState>();
  public readonly hasSearched = input.required<boolean>();

  public readonly sort = output<SortChangeEvent>();
  public readonly pageSizeChange = output<PageSizeChangeEvent>();
  public readonly pageChange = output<PageChangeEvent>();
  public readonly deleteRequest = output<Expense>();

  public readonly pageSizes = [5, 10, 20, 50];

  // Local state signal for coupled sorting parameters
  public readonly sortState = signal<TableSortState>({ column: '', direction: 'none' });

  // Delegate computation to service helper methods using single-line implicit return shortcuts (Rule 5)
  public readonly sortedExpenses = computed(() =>
    this.#tableService.sortExpenses(this.state().expenses, this.sortState()),
  );

  public readonly paginatedExpenses = computed(() =>
    this.#tableService.paginateExpenses(this.sortedExpenses(), this.state().pageSize, this.state().currentPage),
  );

  // Derived properties for template
  public readonly totalCount = computed(() => this.sortedExpenses().length);
  public readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.state().pageSize)));

  public readonly itemRangeLabel = computed(() => {
    const currentPage = this.state().currentPage;
    const pageSize = this.state().pageSize;
    const total = this.totalCount();
    if (total === 0) {
      return '0–0';
    }
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return `${start}–${end}`;
  });

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
    this.sort.emit({ col });
    this.pageChange.emit({ page: 1 });
  }

  protected onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSizeChange.emit({ size: +target.value });
  }

  protected prevPage(): void {
    if (this.state().currentPage > 1) {
      this.pageChange.emit({ page: this.state().currentPage - 1 });
    }
  }

  protected nextPage(): void {
    if (this.state().currentPage < this.totalPages()) {
      this.pageChange.emit({ page: this.state().currentPage + 1 });
    }
  }
}
