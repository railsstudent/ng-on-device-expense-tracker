import { AiSessionStatus } from './ai-session-state.interface';
import { Expense } from './expense.interface';
import { Insight } from './insight.interface';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface AiChatState {
  status: AiSessionStatus;
  error: string | null;
  streamingInsights: Insight[];
}

export interface DateRangeSearch {
  startDate: string;
  endDate: string;
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

/**
 * Represents the layout and alignment configuration for a table header column.
 */
export interface HeaderConfig {
  key: keyof Expense;
  label: string;
  alignRight?: boolean;
}

export interface StatusConfig {
  status: AiChatState['status'];
  class: string;
  label: string;
}
