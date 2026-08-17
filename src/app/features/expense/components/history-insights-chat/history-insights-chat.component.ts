import { isQuerySafeAndRelevant } from '@/core/utils/ai-safety.utils';
import { HistoryInsightsListComponent } from '@/features/expense/components/history-insights-list/history-insights-list.component';
import { HistoryInsightsStatusComponent } from '@/features/expense/components/history-insights-status/history-insights-status.component';
import { AiChatState } from '@/shared/interfaces/history-insights-state.interface';
import { Component, computed, input, output, signal } from '@angular/core';
import { debounce, disabled, form, FormField, submit } from '@angular/forms/signals';

@Component({
  selector: 'app-history-insights-chat',
  imports: [HistoryInsightsStatusComponent, HistoryInsightsListComponent, FormField],
  templateUrl: './history-insights-chat.component.html',
  styleUrls: ['./history-insights-chat.component.css'],
})
export class HistoryInsightsChatComponent {
  public readonly state = input.required<AiChatState>();
  public readonly hasSearched = input.required<boolean>();
  public readonly hasExpenses = input.required<boolean>();

  public readonly askGemma = output<string>();

  // Local Signal-based Form state with localized query (Rule 9 & Rule 12 compliant)
  protected readonly formModel = signal({
    query: '',
  });

  // Signal Form definition with 300ms input debounce and conditional disabled rule (Rule 12 compliant)
  protected readonly chatForm = form(this.formModel, (s) => {
    debounce(s.query, 300);
    disabled(s.query, {
      when: () =>
        !this.hasSearched() || !this.hasExpenses() || ['priming', 'initializing'].includes(this.state().status),
    });
  });

  // Local reactive guardrail computed check (Rule 5 arrow shortcut compliant)
  public readonly isQueryUnsafe = computed(() => {
    const q = this.formModel().query.trim();
    return q.length > 0 && !isQuerySafeAndRelevant(q);
  });

  // Computed signals for submit button disabled state (Rule 5 arrow shortcut)
  public readonly isSubmitDisabled = computed(
    () =>
      !this.formModel().query.trim() ||
      this.isQueryUnsafe() ||
      !this.hasSearched() ||
      !this.hasExpenses() ||
      ['thinking', 'priming', 'initializing'].includes(this.state().status),
  );

  // Computed signal to determine when to show the initial welcome box (Rule 5 arrow shortcut)
  public readonly showWelcomeBox = computed(
    () =>
      this.hasSearched() &&
      this.hasExpenses() &&
      this.state().streamingInsights.length === 0 &&
      !this.isQueryUnsafe() &&
      this.state().status === 'ready',
  );

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.chatForm, async () => this.askGemma.emit(this.formModel().query));
  }
}
