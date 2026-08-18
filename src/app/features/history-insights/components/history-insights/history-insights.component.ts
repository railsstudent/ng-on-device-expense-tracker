import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ConfirmDialogComponent } from '@/shared/ui/components/confirm-dialog/confirm-dialog.component';
import { HistoryInsightsService } from './services/history-insights.service';
import { HistorySearchFormComponent } from '../history-search-form/history-search-form.component';
import { HistoryResultTableComponent } from '../history-result-table/history-result-table.component';
import { HistoryInsightsChatComponent } from '../history-insights-chat/history-insights-chat.component';
import { Expense } from '@/shared/interfaces/expense.interface';
import { AiChatState, DateRangeSearch } from '@/features/history-insights/interfaces/history-insights-state.interface';
import { InsightsResponse } from '@/shared/interfaces/insights-response.interface';

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
  public readonly expenses = signal<Expense[]>([]);
  public readonly hasSearched = signal(false);
  public readonly streamingResponse = signal<InsightsResponse>({ insights: [] });
  public readonly streamingInsights = computed(() => this.streamingResponse().insights ?? []);
  public readonly pendingDeleteExpense = signal<Expense | null>(null);

  // Compute reactive AiChatState parameter object (Rule 5 arrow shortcut)
  public readonly aiState = computed<AiChatState>(() => ({
    status: this.vm.aiStatus(),
    error: this.vm.aiError() ?? null,
    streamingInsights: this.streamingInsights(),
  }));

  // Derived properties for status checking (Rule 5 arrow shortcut)
  public readonly hasExpenses = computed(() => this.expenses().length > 0);

  public async onSearch(criteria: DateRangeSearch): Promise<void> {
    try {
      const list = await this.vm.loadExpenses(criteria.startDate, criteria.endDate);
      this.expenses.set(list);
      this.hasSearched.set(true);
      this.streamingResponse.set({ insights: [] });
    } catch (err) {
      console.error('Error loading history records:', err);
    }
  }

  public openDeleteConfirmation(expense: Expense): void {
    this.pendingDeleteExpense.set(expense);
    this.confirmDialog()?.open();
  }

  public async onDeleteConfirmed(): Promise<void> {
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

  public onDeleteCancelled(): void {
    this.pendingDeleteExpense.set(null);
  }

  public async onAskGemma(query: string): Promise<void> {
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
