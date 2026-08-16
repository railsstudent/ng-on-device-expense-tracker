import { Component, computed, inject, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ConfirmDialogComponent } from '@/shared/ui/components/confirm-dialog/confirm-dialog.component';
import { HistoryInsightsService } from './history-insights.service';
import { HistorySearchFormComponent } from '../history-search-form/history-search-form.component';
import { HistoryResultTableComponent } from '../history-result-table/history-result-table.component';
import { HistoryInsightsChatComponent } from '../history-insights-chat/history-insights-chat.component';
import { Expense } from '@/shared/interfaces/expense.interface';
import {
  LedgerTableState,
  AiChatState,
  DateRangeSearch,
  PageSizeChangeEvent,
  PageChangeEvent,
  QueryChangeEvent,
} from '@/shared/interfaces/history-insights-state.interface';

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
  providers: [HistoryInsightsService],
})
export default class HistoryInsightsComponent {
  public readonly vm = inject(HistoryInsightsService);

  protected readonly confirmDialog = viewChild(ConfirmDialogComponent);

  // Compute reactive LedgerTableState parameter object to pass to Result Table child
  public readonly tableState = computed<LedgerTableState>(() => ({
    expenses: this.vm.sortedExpenses(),
    pageSize: this.vm.pageSize(),
    currentPage: this.vm.currentPage(),
  }));

  // Compute reactive AiChatState parameter object to pass to Insights Chat child
  public readonly aiState = computed<AiChatState>(() => ({
    status: this.vm.aiStatus(),
    error: this.vm.aiError() ?? null,
    query: this.vm.aiQuery(),
    isQueryUnsafe: this.vm.isQueryUnsafe(),
    streamingInsights: this.vm.streamingInsights(),
  }));

  // Derived properties for status checking
  public readonly hasExpenses = computed(() => this.vm.sortedExpenses().length > 0);

  protected onSearch(criteria: DateRangeSearch): void {
    this.vm.formModel.set({
      startDate: criteria.startDate,
      endDate: criteria.endDate,
    });
    this.vm.onSearch();
  }

  protected onSort(): void {
    // Left as no-op; sorting is managed locally in child HistoryResultTableComponent
  }

  protected onPageSizeChange(event: PageSizeChangeEvent): void {
    this.vm.setPageSize(event.size);
  }

  protected onPageChange(event: PageChangeEvent): void {
    this.vm.currentPage.set(event.page);
  }

  protected onQueryChange(event: QueryChangeEvent): void {
    this.vm.aiQuery.set(event.query);
  }

  protected openDeleteConfirmation(expense: Expense): void {
    this.vm.pendingDeleteExpense.set(expense);
    this.confirmDialog()?.open();
  }
}
