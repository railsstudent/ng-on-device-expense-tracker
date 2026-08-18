import { AiChatState } from '@/features/history-insights/interfaces/history-insights-state.interface';
import { Insight } from '@/shared/interfaces/insight.interface';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-history-insights-list',
  template: `
    <div class="chat-insights-list">
      @if (status() === 'thinking' && insights().length === 0) {
        <div class="flex flex-col gap-3">
          <div class="chat-shimmer-card"></div>
          <div class="chat-shimmer-card"></div>
        </div>
      }

      @for (insight of insightsWithIcons(); track $index) {
        <article
          class="chat-insight-card"
          [class.chat-insight-anomaly]="insight.type === 'anomaly'"
          [class.chat-insight-saving]="insight.type === 'saving'"
          [class.chat-insight-trend]="insight.type === 'trend'"
          [class.chat-insight-default]="
            insight.type !== 'anomaly' && insight.type !== 'saving' && insight.type !== 'trend'
          "
        >
          <header class="chat-insight-card-header">
            <span class="material-symbols-outlined text-lg">
              {{ insight.icon }}
            </span>
            <h3 class="chat-insight-card-title">{{ insight.title }}</h3>
          </header>
          <p class="chat-insight-card-desc">{{ insight.message }}</p>
        </article>
      }

      @if (showWelcomeBox()) {
        <div class="chat-welcome-box">
          <span class="material-symbols-outlined chat-welcome-icon">chat_bubble</span>
          <p>Type a question above and click <strong>Ask Gemma</strong> to extract financial insights.</p>
        </div>
      }
    </div>
  `,
  styleUrl: './history-insights-list.component.css',
})
export class HistoryInsightsListComponent {
  public readonly insights = input.required<Insight[]>();
  public readonly status = input.required<AiChatState['status']>();
  public readonly showWelcomeBox = input.required<boolean>();
  public readonly isQueryUnsafe = input.required<boolean>();

  // Lookup map to associate categories to Material symbols (Rule 11 lookup pattern)
  protected readonly iconMap: Partial<Record<Insight['type'], string>> = {
    anomaly: 'error',
    saving: 'payments',
    trend: 'trending_up',
  };

  // Resolve icons using mapped lookup (Rule 5 arrow shortcut is fully satisfied)
  public readonly insightsWithIcons = computed(() =>
    this.insights().map((insight) => ({
      ...insight,
      icon: this.iconMap[insight.type] ?? 'info',
    })),
  );
}
