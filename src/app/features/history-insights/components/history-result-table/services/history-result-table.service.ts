import { Service } from '@angular/core';
import { Expense } from '@/shared/interfaces/expense.interface';
import { SortDirection, TableSortState } from '@/features/history-insights/interfaces/history-insights-state.interface';

@Service()
export class HistoryResultTableService {
  /**
   * Sorts the provided list of expenses based on a specific column and sort direction.
   */
  public sortExpenses(expenses: Expense[], { column, direction }: TableSortState): Expense[] {
    if (!column || direction === 'none') {
      return expenses;
    }

    const asc = direction === 'asc';

    return [...expenses].sort((a, b) => {
      const aVal = a[column] ?? '';
      const bVal = b[column] ?? '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return asc ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) {
        return asc ? -1 : 1;
      }
      if (aStr > bStr) {
        return asc ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Extracts a specific page slice from the array of sorted expenses.
   */
  public paginateExpenses(expenses: Expense[], pageSize: number, currentPage: number): Expense[] {
    const startIdx = (currentPage - 1) * pageSize;
    return expenses.slice(startIdx, startIdx + pageSize);
  }

  /**
   * Cycles through the sort direction states: none -> asc -> desc -> none.
   */
  public getNextSortDirection(current: SortDirection): SortDirection {
    const nextMap: Partial<Record<SortDirection, SortDirection>> = {
      none: 'asc',
      asc: 'desc',
    };
    return nextMap[current] ?? 'none';
  }

  /**
   * Generates a fully compiled map of sort icons for all columns.
   */
  public getSortIconMap(sort: TableSortState): Record<keyof Expense, string> {
    return {
      id: this.getSortIcon('id', sort),
      merchantName: this.getSortIcon('merchantName', sort),
      amount: this.getSortIcon('amount', sort),
      transactionDate: this.getSortIcon('transactionDate', sort),
      category: this.getSortIcon('category', sort),
      isReceipt: this.getSortIcon('isReceipt', sort),
    };
  }

  /**
   * Private helper to resolve a single column's sort icon based on current state (Rule 1).
   */
  private getSortIcon(column: keyof Expense, { column: activeCol, direction: dir }: TableSortState): string {
    if (activeCol === column && dir !== 'none') {
      return dir === 'asc' ? 'expand_less' : 'expand_more';
    }
    return 'unfold_more';
  }

  /**
   * Calculates the current item range display label.
   */
  public getItemRangeLabel(currentPage: number, pageSize: number, totalCount: number): string {
    if (totalCount === 0) {
      return '0–0';
    }
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return `${start}–${end}`;
  }
}
