import { isQuerySafeAndRelevant } from '@/core/utils/ai-safety.utils';
import { HistoryInsightsListComponent } from '@/features/history-insights/components/history-insights-list/history-insights-list.component';
import { HistoryInsightsStatusComponent } from '@/features/history-insights/components/history-insights-status/history-insights-status.component';
import { AiChatState } from '@/features/history-insights/interfaces/history-insights-state.interface';
import { Component, computed, input, output, signal } from '@angular/core';
import { debounce, disabled, form, FormField, submit } from '@angular/forms/signals';

@Component({
  selector: 'app-history-insights-chat',
  imports: [HistoryInsightsStatusComponent, HistoryInsightsListComponent, FormField],
  templateUrl: './history-insights-chat.component.html',
  styleUrls: ['./history-insights-chat.component.css'],
})
export class HistoryInsightsChatComponent {
  readonly state = input.required<AiChatState>();
  readonly hasSearched = input.required<boolean>();
  readonly hasExpenses = input.required<boolean>();

  readonly streamingInsights = computed(() => this.state().streamingInsights);
  readonly status = computed(() => this.state().status);
  readonly error = computed(() => this.state().error);

  readonly askGemma = output<string>();

  // Local Signal-based Form state with localized query (Rule 9 & Rule 12 compliant)
  protected readonly formModel = signal({
    query: '',
  });

  // Chat is disabled if there are no search results, no expenses, or if Gemma is preparing
  readonly isChatDisabled = computed(
    () => !this.hasSearched() || !this.hasExpenses() || ['priming', 'initializing'].includes(this.status()),
  );

  // Signal Form definition with 300ms input debounce and conditional disabled rule (Rule 12 compliant)
  protected readonly chatForm = form(this.formModel, (s) => {
    debounce(s.query, 300);
    disabled(s.query, {
      when: () => this.isChatDisabled(),
    });
  });

  // Reactive helper for the trimmed user query (Rule 5 arrow shortcut)
  readonly trimmedQuery = computed(() => this.formModel().query.trim());

  // Local reactive guardrail computed check (Rule 5 arrow shortcut compliant)
  readonly isQueryUnsafe = computed(() => !!this.trimmedQuery() && !isQuerySafeAndRelevant(this.trimmedQuery()));

  // Computed signals for submit button disabled state (Rule 5 arrow shortcut)
  readonly isSubmitDisabled = computed(
    () => !this.trimmedQuery() || this.isQueryUnsafe() || this.isChatDisabled() || this.status() === 'thinking',
  );

  // Computed signal to determine when to show the initial welcome box (Rule 5 arrow shortcut)
  readonly showWelcomeBox = computed(
    () =>
      !this.isChatDisabled() && !this.isQueryUnsafe() && this.status() === 'ready' && !this.streamingInsights().length,
  );

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.chatForm, async () => this.askGemma.emit(this.trimmedQuery()));
  }
}
