import { Component, input, output } from '@angular/core';
import { AiChatState, QueryChangeEvent } from '@/shared/interfaces/history-insights-state.interface';

@Component({
  selector: 'app-history-insights-chat',
  imports: [],
  templateUrl: './history-insights-chat.component.html',
  styleUrls: ['./history-insights-chat.component.css'],
})
export class HistoryInsightsChatComponent {
  public readonly state = input.required<AiChatState>();
  public readonly hasSearched = input.required<boolean>();
  public readonly hasExpenses = input.required<boolean>();

  public readonly queryChange = output<QueryChangeEvent>();
  public readonly askGemma = output<void>();

  protected onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.queryChange.emit({ query: val });
  }
}
