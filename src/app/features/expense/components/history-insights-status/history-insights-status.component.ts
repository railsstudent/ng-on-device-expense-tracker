import { AiChatState, StatusConfig } from '@/shared/interfaces/history-insights-state.interface';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-history-insights-status',
  template: `
    <div>
      @for (cfg of statusConfigs; track cfg.status) {
        @if (cfg.status === status()) {
          <div
            [class]="'chat-badge chat-badge-' + cfg.class"
            [title]="cfg.status === 'failed' ? error() || 'Connection failed' : ''"
          >
            <span [class]="'chat-dot chat-dot-' + cfg.class"></span>
            <span>{{ cfg.label }}</span>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './history-insights-status.component.css',
})
export class HistoryInsightsStatusComponent {
  public readonly status = input.required<AiChatState['status']>();
  public readonly error = input<string | null>(null);

  protected readonly statusConfigs: StatusConfig[] = [
    { status: 'initializing', class: 'initializing', label: 'Loading Gemma 4...' },
    { status: 'priming', class: 'priming', label: 'Priming dataset context...' },
    { status: 'thinking', class: 'thinking', label: 'Gemma is thinking...' },
    { status: 'ready', class: 'ready', label: 'Gemma 4: Active' },
    { status: 'failed', class: 'failed', label: 'AI Error / 載入失敗' },
    { status: 'idle', class: 'idle', label: 'Session Idle' },
  ];
}
