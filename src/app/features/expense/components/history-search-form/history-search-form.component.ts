import { DateRangeSearch } from '@/shared/interfaces/history-insights-state.interface';
import { Component, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-history-search-form',
  imports: [FormField],
  templateUrl: './history-search-form.component.html',
  styleUrls: ['./history-search-form.component.css'],
})
export class HistorySearchFormComponent {
  public readonly searchSubmit = output<DateRangeSearch>();

  protected readonly formModel = signal({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0],
  });

  protected readonly searchForm = form(this.formModel, (s) => {
    required(s.startDate, { message: 'Start date is required' });
    required(s.endDate, { message: 'End date is required' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.searchForm().invalid()) {
      return;
    }
    this.searchSubmit.emit(this.formModel());
  }
}
