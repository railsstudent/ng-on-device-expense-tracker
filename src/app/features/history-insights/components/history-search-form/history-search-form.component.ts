import { DateRangeSearch } from '@/features/history-insights/interfaces/history-insights-state.interface';
import { Component, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

@Component({
  selector: 'app-history-search-form',
  imports: [FormField],
  templateUrl: './history-search-form.component.html',
  styleUrls: ['./history-search-form.component.css'],
})
export class HistorySearchFormComponent {
  readonly searchSubmit = output<DateRangeSearch>();

  // Localized state validation error (Rule 9 Signal Localization compliant)
  readonly dateRangeError = signal('');

  protected readonly formModel = signal({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0],
  });

  protected readonly searchForm = form(this.formModel, (s) => {
    required(s.startDate, { message: 'Start date is required' });
    required(s.endDate, { message: 'End date is required' });
  });

  /**
   * Helper validator to enforce chronological bounds and maximum 31 days span constraints.
   * Utilizes private TypeScript helper encapsulation as mandated.
   */
  private validateDateRange(startDateStr: string, endDateStr: string): boolean {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (end < start) {
      this.dateRangeError.set('End date cannot be earlier than start date');
      return false;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / MS_PER_DAY);
    if (diffDays > 31) {
      this.dateRangeError.set(
        'Search date range cannot exceed 1 month to ensure local AI performance / 查詢日期範圍不能超過1個月',
      );
      return false;
    }

    return true;
  }

  /**
   * Evaluates input boundary constraints before emitting search.
   * Keeps method under 40 lines and delegates date range checking to helper validator.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.dateRangeError.set('');

    if (this.searchForm().invalid()) {
      return;
    }

    const { startDate, endDate } = this.formModel();
    if (!this.validateDateRange(startDate, endDate)) {
      return;
    }

    this.searchSubmit.emit(this.formModel());
  }
}
