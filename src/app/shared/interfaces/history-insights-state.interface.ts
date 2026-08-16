import { Expense } from './expense.interface';
import { Insight } from './insight.interface';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface LedgerTableState {
  expenses: Expense[];
  pageSize: number;
  currentPage: number;
}

export interface AiChatState {
  status: 'initializing' | 'priming' | 'thinking' | 'ready' | 'failed' | 'idle';
  error: string | null;
  query: string;
  isQueryUnsafe: boolean;
  streamingInsights: Insight[];
}

export interface DateRangeSearch {
  startDate: string;
  endDate: string;
}

export interface SortChangeEvent {
  col: keyof Expense;
}

export interface PageSizeChangeEvent {
  size: number;
}

export interface PageChangeEvent {
  page: number;
}

export interface QueryChangeEvent {
  query: string;
}

/**
 * Represents any sortable column name of the Expense model, or an empty string for default order.
 */
export type SortableColumn = keyof Expense | '';

/**
 * Encapsulates the cohesive sorting parameters of the data table.
 */
export interface TableSortState {
  column: SortableColumn;
  direction: SortDirection;
}
