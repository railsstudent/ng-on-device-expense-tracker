import { Component, input, output } from '@angular/core';
import { TableSortState, HeaderConfig } from '@/features/history-insights/interfaces/history-insights-state.interface';
import { Expense } from '@/shared/interfaces/expense.interface';

@Component({
  selector: 'app-history-mobile-sort',
  templateUrl: './history-mobile-sort.component.html',
  styleUrls: ['./history-mobile-sort.component.css'],
})
export class HistoryMobileSortComponent {
  // Accept dynamic headers list to enforce a single source of truth
  public readonly headers = input.required<HeaderConfig[]>();

  // Emits the exact unified state to assign directly to the parent's sortState signal
  public readonly sortChange = output<TableSortState>();

  protected onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const val = target.value;
    if (!val) {
      this.sortChange.emit({ column: '', direction: 'none' });
    } else {
      const [col, dir] = val.split('-') as [keyof Expense, 'asc' | 'desc'];
      this.sortChange.emit({ column: col, direction: dir });
    }
  }
}
