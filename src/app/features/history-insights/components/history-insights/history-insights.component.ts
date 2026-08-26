import { HistoryInsightsChatComponent } from '@/features/history-insights/components/history-insights-chat/history-insights-chat.component';
import { HistoryResultTableComponent } from '@/features/history-insights/components/history-result-table/history-result-table.component';
import { HistorySearchFormComponent } from '@/features/history-insights/components/history-search-form/history-search-form.component';
import { AiChatState, DateRangeSearch } from '@/features/history-insights/interfaces/history-insights-state.interface';
import { Expense } from '@/shared/interfaces/expense.interface';
import { InsightsResponse } from '@/shared/interfaces/insights-response.interface';
import { ConfirmDialogComponent } from '@/shared/ui/components/confirm-dialog/confirm-dialog.component';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { HistoryInsightsService } from './services/history-insights.service';

@Component({
  selector: 'app-history-insights',
  imports: [
    HistorySearchFormComponent,
    HistoryResultTableComponent,
    HistoryInsightsChatComponent,
    ConfirmDialogComponent,
    CurrencyPipe,
  ],
  templateUrl: './history-insights.component.html',
  styleUrls: ['./history-insights.component.css'],
})
export default class HistoryInsightsComponent {
  // Service Facade (Stateless calculation and API processing)
  protected readonly vm = inject(HistoryInsightsService);

  protected readonly confirmDialog = viewChild(ConfirmDialogComponent);

  // Presentational/View States (Rule 9 Signal Localization)
  readonly expenses = signal<Expense[]>([]);
  readonly hasSearched = signal(false);
  readonly streamingResponse = signal<InsightsResponse>({ insights: [] });
  readonly pendingDeleteExpense = signal<Expense | null>(null);

  // Compute reactive AiChatState parameter object (Rule 5 arrow shortcut)
  readonly aiState = computed<AiChatState>(() => ({
    status: this.vm.aiStatus(),
    error: this.vm.aiError() ?? null,
    streamingInsights: this.streamingResponse().insights ?? [],
  }));

  // Derived properties for status checking (Rule 5 arrow shortcut)
  readonly hasExpenses = computed(() => this.expenses().length > 0);

  async onSearch(criteria: DateRangeSearch): Promise<void> {
    try {
      const list = await this.vm.loadExpenses(criteria.startDate, criteria.endDate);
      this.expenses.set(list);
      this.hasSearched.set(true);
      this.streamingResponse.set({ insights: [] });
    } catch (err) {
      console.error('Error loading history records:', err);
    }
  }

  openDeleteConfirmation(expense: Expense): void {
    this.pendingDeleteExpense.set(expense);
    this.confirmDialog()?.open();
  }

  async onDeleteConfirmed(): Promise<void> {
    const expense = this.pendingDeleteExpense();
    if (expense && expense.id !== undefined) {
      try {
        await this.vm.deleteExpense(expense.id);
        const currentList = this.expenses();
        const updatedList = currentList.filter((item) => item.id !== expense.id);
        this.expenses.set(updatedList);
      } catch (err) {
        console.error('Failed to delete expense record:', err);
      } finally {
        this.pendingDeleteExpense.set(null);
      }
    }
  }

  onDeleteCancelled(): void {
    this.pendingDeleteExpense.set(null);
  }

  async onAskGemma(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    // Clear previous insights response immediately before querying
    this.streamingResponse.set({ insights: [] });

    try {
      const generator = this.vm.streamInsights(trimmed, this.expenses());
      for await (const response of generator) {
        // Display only the current query's streaming insights response
        this.streamingResponse.set(response);
      }
    } catch (err) {
      console.error('Error consuming Gemma insight stream:', err);
    }
  }
}
