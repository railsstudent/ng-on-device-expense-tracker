import { INSIGHTS_PRIMING_PROMPT, INSIGHTS_USER_PROMPT } from '@/core/consts/insight-prompt.const';
import { AiSessionState } from '@/shared/interfaces/ai-session-state.interface';
import { Expense } from '@/shared/interfaces/expense.interface';
import { Insight } from '@/shared/interfaces/insight.interface';
import { computed, inject, OnDestroy, Service, signal } from '@angular/core';
import { Conversation } from '@litert-lm/core';
import { jsonrepair } from 'jsonrepair';
import { GemmaEngineService } from './gemma-engine.service';
import { safeDeleteConversation } from '@/core/utils/ai-conversation.utils';

@Service()
export class InsightService implements OnDestroy {
  readonly #engineService = inject(GemmaEngineService);

  readonly #state = signal<AiSessionState>({ status: 'idle' });
  #conversation: Conversation | null = null;
  #isPriming = false;
  #lastPrimedExpenses: Expense[] | null = null;

  public readonly status = computed(() => this.#state().status);
  public readonly error = computed(() => this.#state().error);

  /**
   * Safe and lazy priming helper.
   * Initializes the engine and sets up the conversation with the designated dataset.
   */
  private async primeContext(expenses: Expense[]): Promise<void> {
    if (this.#isPriming) {
      return;
    }
    this.#isPriming = true;
    this.#state.set({ status: 'priming' });

    try {
      const engine = await this.#engineService.getEngine();

      await safeDeleteConversation(this.#conversation);
      this.#conversation = null;

      const conversationInstance = await engine.createConversation();
      if (!conversationInstance) {
        throw new Error('Failed to create a local Gemma 4 conversation session.');
      }
      this.#conversation = conversationInstance;

      const datasetJson = JSON.stringify(
        expenses.map((e) => ({
          merchant: e.merchantName,
          amount: e.amount,
          date: e.transactionDate,
          category: e.category,
        })),
      );

      const primingPrompt = INSIGHTS_PRIMING_PROMPT(datasetJson);

      // Execute priming prompt asynchronously (consumes internal token stream automatically)
      await this.#conversation.sendMessage(primingPrompt);

      this.#lastPrimedExpenses = expenses;
      this.#state.set({ status: 'ready' });
    } catch (err) {
      console.error('Error priming Gemma 4 context:', err);
      const msg = err instanceof Error ? err.message : 'Failed to prime AI context.';
      this.#state.set({ status: 'failed', error: msg });
      throw err;
    } finally {
      this.#isPriming = false;
    }
  }

  /**
   * Private helper to extract plain text string from multi-part or string response chunks.
   */
  private extractChunkText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content) && content[0]) {
      const part = content[0] as Record<string, unknown>;
      if (part && typeof part['text'] === 'string') {
        return part['text'];
      }
    }
    return '';
  }

  /**
   * Core generator function to stream insights on-demand.
   * Lazily checks if context needs to be primed before executing streaming queries.
   */
  public async *streamInsights(userQuery: string, expenses: Expense[]): AsyncGenerator<Insight[]> {
    const isContextDifferent = this.#lastPrimedExpenses !== expenses;

    if (!this.#conversation || isContextDifferent) {
      await this.primeContext(expenses);
    }

    if (!this.#conversation) {
      throw new Error('AI conversation session is not initialized.');
    }

    this.#state.set({ status: 'thinking' });
    let lastValidInsights: Insight[] = [];
    let buffer = '';

    try {
      const userPrompt = INSIGHTS_USER_PROMPT(userQuery);
      const stream = await this.#conversation.sendMessageStreaming(userPrompt);

      for await (const chunk of stream) {
        if (chunk.content) {
          buffer = buffer + this.extractChunkText(chunk.content);
          try {
            const repairedJson = jsonrepair(buffer);
            const parsed = JSON.parse(repairedJson);
            if (parsed && Array.isArray(parsed.insights)) {
              lastValidInsights = parsed.insights;
            }
          } catch {
            // Keep yielding last valid parsed state upon json exception
          }
          yield lastValidInsights;
        }
      }

      this.#state.set({ status: 'ready' });
    } catch (err) {
      console.error('Error streaming insights:', err);
      const msg = err instanceof Error ? err.message : 'Error generating insights.';
      this.#state.set({ status: 'failed', error: msg });
      throw err;
    }
  }

  public async ngOnDestroy(): Promise<void> {
    await safeDeleteConversation(this.#conversation);
    this.#conversation = null;
    this.#lastPrimedExpenses = null;
    this.#state.set({ status: 'idle' });
  }
}
