import { INSIGHTS_PRIMING_PROMPT, INSIGHTS_USER_PROMPT } from '@/core/consts/insight-prompt.const';
import { safeDeleteConversation } from '@/core/utils/ai-conversation.utils';
import { computeExpenseStatsJson } from '@/core/utils/insight-calculator.utils';
import { AiSessionState } from '@/shared/interfaces/ai-session-state.interface';
import { Expense } from '@/shared/interfaces/expense.interface';
import { InsightsResponse } from '@/shared/interfaces/insights-response.interface';
import { computed, inject, OnDestroy, Service, signal } from '@angular/core';
import { Conversation } from '@litert-lm/core';
import { jsonrepair } from 'jsonrepair';
import { GemmaEngineService } from './gemma-engine.service';

@Service()
export class InsightService implements OnDestroy {
  readonly #engineService = inject(GemmaEngineService);

  readonly #state = signal<AiSessionState>({ status: 'idle' });
  #conversation: Conversation | null = null;
  #isPriming = false;
  #lastPrimedExpenses: Expense[] | null = null;

  // Sliding 2-Question Context State Properties
  #turnsCount = 0;
  #previousQueries: string[] = [];

  public readonly status = computed(() => this.#state().status);
  public readonly error = computed(() => this.#state().error);

  /**
   * Helper to format raw expenses into a compact pipe-delimited CSV structure.
   * Restores highly optimized format to save 61% of transaction record token load.
   */
  private formatExpensesToCsv(expenses: Expense[]): string {
    return [
      'Date|Category|Merchant|Amount',
      ...expenses.map(
        (e) =>
          `${e.transactionDate}|${e.category.replace(/\|/g, ' ')}|${e.merchantName.replace(/\|/g, ' ')}|${e.amount.toFixed(2)}`,
      ),
    ].join('\n');
  }

  /**
   * Safe and lazy priming helper.
   * Initializes the engine and sets up the conversation with the designated dataset.
   */
  private async primeContext(expenses: Expense[], previousQueries?: string[]): Promise<void> {
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

      const datasetCsv = this.formatExpensesToCsv(expenses);
      const precomputedStatsJson = computeExpenseStatsJson(expenses);
      let primingPrompt = INSIGHTS_PRIMING_PROMPT(datasetCsv, precomputedStatsJson);

      if (previousQueries && previousQueries.length > 0) {
        const formattedQueries = previousQueries.map((q) => `"${q}"`).join(', ');
        primingPrompt = `${primingPrompt}\n\nNote: In this session, the user previously asked about: ${formattedQueries}. Keep this in mind if their next query is a follow-up.`;
      }

      await this.#conversation.sendMessage(primingPrompt);

      this.#lastPrimedExpenses = expenses;
      this.#turnsCount = 0;
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
   * Streams and repairs token chunks on-the-fly.
   */
  private async *processStream(stream: AsyncIterable<unknown>): AsyncGenerator<InsightsResponse> {
    let lastValidResponse: InsightsResponse = { insights: [] };
    let buffer = '';

    for await (const chunk of stream) {
      const typedChunk = chunk as { content?: unknown };
      if (typedChunk && typedChunk.content) {
        buffer = buffer + this.extractChunkText(typedChunk.content);
        try {
          const repairedJson = jsonrepair(buffer);
          const parsed = JSON.parse(repairedJson);
          if (parsed && Array.isArray(parsed.insights)) {
            lastValidResponse = parsed as InsightsResponse;
          }
        } catch {
          // Keep yielding last valid parsed state upon json exception
        }
        yield lastValidResponse;
      }
    }
  }

  private resetSession(): void {
    this.#conversation = null;
    this.#lastPrimedExpenses = null;
    this.#turnsCount = 0;
  }

  /**
   * Core generator function to stream insights on-demand.
   * Lazily checks if context needs to be primed before executing streaming queries.
   */
  public async *streamInsights(userQuery: string, expenses: Expense[]): AsyncGenerator<InsightsResponse> {
    const isContextDifferent = this.#lastPrimedExpenses !== expenses;
    const isContextExhausted = this.#turnsCount >= 3;

    if (!this.#conversation || isContextDifferent || isContextExhausted) {
      console.log(`Resetting/Priming AI Context. Different: ${isContextDifferent}, Exhausted: ${isContextExhausted}`);
      const previousQueries = isContextExhausted ? this.#previousQueries : undefined;
      await this.primeContext(expenses, previousQueries);
    }

    if (!this.#conversation) {
      throw new Error('AI conversation session is not initialized.');
    }

    this.#state.set({ status: 'thinking' });

    try {
      const userPrompt = INSIGHTS_USER_PROMPT(userQuery);
      const stream = await this.#conversation.sendMessageStreaming(userPrompt);

      this.#previousQueries.push(userQuery);
      if (this.#previousQueries.length > 2) {
        this.#previousQueries.shift();
      }
      this.#turnsCount = this.#turnsCount + 1;

      yield* this.processStream(stream);
      this.#state.set({ status: 'ready' });
    } catch (err) {
      console.error('Error streaming insights:', err);
      this.resetSession();
      const msg = err instanceof Error ? err.message : 'Error generating insights.';
      this.#state.set({ status: 'failed', error: msg });
      throw err;
    }
  }

  public async ngOnDestroy(): Promise<void> {
    await safeDeleteConversation(this.#conversation);
    this.resetSession();
    this.#state.set({ status: 'idle' });
  }
}
