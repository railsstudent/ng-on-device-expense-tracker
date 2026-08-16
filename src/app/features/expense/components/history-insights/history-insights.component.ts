import { InsightService } from '@/core/services/ai/insight.service';
import { DatabaseService } from '@/core/services/database.service';
import { isQuerySafeAndRelevant } from '@/core/utils/ai-safety.utils';
import { Expense } from '@/shared/interfaces/expense.interface';
import { Insight } from '@/shared/interfaces/insight.interface';
import { ConfirmDialogComponent } from '@/shared/ui/components/confirm-dialog/confirm-dialog.component';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-history-insights',
  imports: [FormField, ConfirmDialogComponent, CurrencyPipe],
  templateUrl: './history-insights.component.html',
  styleUrls: ['./history-insights.component.css'],
})
export default class HistoryInsightsComponent {
  readonly #dbService = inject(DatabaseService);
  readonly #insightService = inject(InsightService);

  // Modern viewChild query signal
  protected readonly confirmDialog = viewChild(ConfirmDialogComponent);

  protected readonly Math = Math;

  // Modern Signal-based Form state
  protected readonly formModel = signal({
    startDate: '',
    endDate: '',
  });

  // Construct Signal Form validation schema
  protected readonly searchForm = form(this.formModel, (s) => {
    required(s.startDate, { message: 'Start date is required' });
    required(s.endDate, { message: 'End date is required' });
  });

  // Reactive state signals (implicit type inference used where possible)
  readonly #expenses = signal<Expense[]>([]);
  public readonly hasSearched = signal(false);
  public readonly sortBy = signal<keyof Expense | ''>('');
  public readonly sortAsc = signal(true);
  public readonly pageSize = signal(10);
  public readonly currentPage = signal(1);

  // Chat/Insight state signals
  public readonly aiQuery = signal('');
  public readonly isQueryUnsafe = signal(false);
  public readonly streamingInsights = signal<Insight[]>([]);
  public readonly pendingDeleteExpense = signal<Expense | null>(null);

  // Computed signals using arrow function shortcuts for single-liners
  public readonly aiStatus = computed(() => this.#insightService.status());
  public readonly aiError = computed(() => this.#insightService.error());
  public readonly totalCount = computed(() => this.sortedExpenses().length);
  public readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  // Complex sorted expenses computed pipeline
  public readonly sortedExpenses = computed(() => {
    const raw = this.#expenses();
    const col = this.sortBy();
    const asc = this.sortAsc();

    if (!col) {
      return raw;
    }

    return [...raw].sort((a, b) => {
      const aVal = a[col] ?? '';
      const bVal = b[col] ?? '';

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
  });

  // Paginated computed pipeline
  public readonly paginatedExpenses = computed(() => {
    const list = this.sortedExpenses();
    const size = this.pageSize();
    const page = this.currentPage();
    const startIdx = (page - 1) * size;
    return list.slice(startIdx, startIdx + size);
  });

  // Programmatic handlers
  protected async onSearch(): Promise<void> {
    if (this.searchForm().invalid()) {
      return;
    }

    const { startDate, endDate } = this.formModel();
    try {
      const list = await this.#dbService.selectByDateRange(startDate, endDate);
      this.#expenses.set(list);
      this.hasSearched.set(true);
      this.currentPage.set(1);
      this.streamingInsights.set([]);
      this.isQueryUnsafe.set(false);
    } catch (err) {
      console.error('Error loading history records:', err);
    }
  }

  protected toggleSort(col: keyof Expense): void {
    if (this.sortBy() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortBy.set(col);
      this.sortAsc.set(true);
    }
    this.currentPage.set(1);
  }

  protected setPageSize(size: number): void {
    this.pageSize.set(size);
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

  protected openDeleteConfirmation(expense: Expense): void {
    this.pendingDeleteExpense.set(expense);
    this.confirmDialog()?.open();
  }

  protected async onDeleteConfirmed(): Promise<void> {
    const expense = this.pendingDeleteExpense();
    if (expense && expense.id !== undefined) {
      try {
        await this.#dbService.delete(expense.id);
        const currentList = this.#expenses();
        const updatedList = currentList.filter((item) => item.id !== expense.id);
        this.#expenses.set(updatedList);

        // Adjust pagination page boundaries if page is left completely empty
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      } catch (err) {
        console.error('Failed to delete expense record:', err);
      } finally {
        this.pendingDeleteExpense.set(null);
      }
    }
  }

  protected onDeleteCancelled(): void {
    this.pendingDeleteExpense.set(null);
  }

  protected onQueryChange(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.aiQuery.set(val);
  }

  protected async onAskGemma(): Promise<void> {
    const query = this.aiQuery().trim();
    if (!query) {
      return;
    }

    // Evaluate client-side safety guardrails
    if (!isQuerySafeAndRelevant(query)) {
      this.isQueryUnsafe.set(true);
      this.streamingInsights.set([]);
      return;
    }

    this.isQueryUnsafe.set(false);
    this.streamingInsights.set([]);

    try {
      // Pass the current list of queried and sorted expenses directly to support lazy on-demand priming!
      const generator = this.#insightService.streamInsights(query, this.sortedExpenses());
      for await (const list of generator) {
        this.streamingInsights.set(list);
      }
    } catch (err) {
      console.error('Error consuming Gemma insight stream:', err);
    }
  }
}
