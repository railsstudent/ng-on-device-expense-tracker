import { DatabaseService } from '@/core/services/database.service';
import { InsightService } from '@/core/services/ai/insight.service';
import { isQuerySafeAndRelevant } from '@/core/utils/ai-safety.utils';
import { Expense } from '@/shared/interfaces/expense.interface';
import { Insight } from '@/shared/interfaces/insight.interface';
import { Service, computed, inject, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';

@Service()
export class HistoryInsightsService {
  readonly #dbService = inject(DatabaseService);
  readonly #insightService = inject(InsightService);

  // Modern Signal-based Form state
  public readonly formModel = signal({
    startDate: '',
    endDate: '',
  });

  // Construct Signal Form validation schema
  public readonly searchForm = form(this.formModel, (s) => {
    required(s.startDate, { message: 'Start date is required' });
    required(s.endDate, { message: 'End date is required' });
  });

  // Reactive state signals
  readonly #expenses = signal<Expense[]>([]);
  public readonly expenses = computed(() => this.#expenses());
  public readonly hasSearched = signal(false);
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

  // Programmatic handlers
  public async onSearch(): Promise<void> {
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

  public async onDeleteConfirmed(): Promise<void> {
    const expense = this.pendingDeleteExpense();
    if (expense && expense.id !== undefined) {
      try {
        await this.#dbService.delete(expense.id);
        const currentList = this.#expenses();
        const updatedList = currentList.filter((item) => item.id !== expense.id);
        this.#expenses.set(updatedList);

        // Adjust pagination page boundaries locally if page is left completely empty
        const maxPages = Math.max(1, Math.ceil(updatedList.length / this.pageSize()));
        if (this.currentPage() > maxPages) {
          this.currentPage.set(maxPages);
        }
      } catch (err) {
        console.error('Failed to delete expense record:', err);
      } finally {
        this.pendingDeleteExpense.set(null);
      }
    }
  }

  public onDeleteCancelled(): void {
    this.pendingDeleteExpense.set(null);
  }

  public onQueryChange(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.aiQuery.set(val);
  }

  public async onAskGemma(): Promise<void> {
    const query = this.aiQuery().trim();
    if (!query) {
      return;
    }

    if (!isQuerySafeAndRelevant(query)) {
      this.isQueryUnsafe.set(true);
      this.streamingInsights.set([]);
      return;
    }

    this.isQueryUnsafe.set(false);
    this.streamingInsights.set([]);

    try {
      const generator = this.#insightService.streamInsights(query, this.#expenses());
      for await (const list of generator) {
        this.streamingInsights.set(list);
      }
    } catch (err) {
      console.error('Error consuming Gemma insight stream:', err);
    }
  }
}
