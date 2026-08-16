import { RECEIPT_SYSTEM_PROMPT } from '@/core/consts/receipt-prompt.const';
import { WINDOW } from '@/core/consts/window.const';
import { sanitizeJsonString } from '@/core/utils/json.utils';
import { runOcr } from '@/core/utils/ocr.utils';
import {
  createCompletedAnalysisState,
  createFailedAnalysisState,
  createIdleAnalysisState,
  createProcessingAnalysisState,
} from '@/core/utils/receipt-analysis-state.utils';
import { safeDeleteConversation } from '@/core/utils/ai-conversation.utils';
import { ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { ReceiptAnalysisState } from '@/shared/interfaces/receipt-analysis-state.interface';
import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';
import { Conversation, Message } from '@litert-lm/core';
import { GemmaEngineService } from './gemma-engine.service';

@Service()
export class ReceiptAnalyzerService {
  readonly #engineService = inject(GemmaEngineService);
  readonly #window = inject(WINDOW);
  readonly #document = inject(DOCUMENT);

  // Single backing state signal
  readonly #state = signal<ReceiptAnalysisState>(createIdleAnalysisState());

  // Concurrency guard lock to prevent memory context leaks and overlapping WebGPU compiler compilations
  #isAnalyzing = false;

  // Public read-only computed signals (fully backward-compatible with UI templates)
  public readonly status = computed(() => this.#state().status);
  public readonly isProcessing = computed(() => this.#state().isProcessing);

  // Dynamically computed status text (translation / presentation layer separated from state)
  public readonly statusText = computed(() => {
    const state = this.#state();
    switch (state.status) {
      case 'idle':
        return '';
      case 'scanning':
        return 'Scanning receipt text (OCR stage)...';
      case 'initializing':
        return 'Initializing Gemma 4 AI engine (WebGPU)...';
      case 'parsing':
        return 'Gemma is thinking... Parsing receipt data...';
      case 'completed':
        return 'Analysis completed successfully!';
      case 'failed':
        return state.error ? `Analysis failed: ${state.error}` : 'Analysis failed.';
    }
  });

  private async runGemmaParsing(conversation: Conversation, ocrText: string): Promise<string> {
    this.#state.set(createProcessingAnalysisState('parsing'));
    const currentDateString = new Date().toISOString().split('T')[0];
    const promptText = `${RECEIPT_SYSTEM_PROMPT(currentDateString)}\n\nHere is the raw OCR text of the receipt:\n${ocrText}`;

    const response: Message = await conversation.sendMessage(promptText);
    return this.extractResponseText(response);
  }

  /**
   * Orchestrates the complete OCR and local AI parsing pipeline.
   * Extracts text, initializes Gemma 4 (cached on service lifecycle), prompts for JSON, and parses result.
   */
  public async analyzeReceipt(imageFile: File | Blob | string): Promise<ExtractedExpense> {
    if (this.#isAnalyzing) {
      throw new Error('A receipt analysis is already in progress. Please wait for it to complete.');
    }
    this.#isAnalyzing = true;
    this.#state.set(createProcessingAnalysisState('initializing'));
    let conversation: Conversation | null = null;

    try {
      this.#state.set(createProcessingAnalysisState('scanning'));
      const origin = this.#window?.location?.origin || '';
      const localLangPath = origin ? `${origin}/assets/tessdata/` : '/assets/tessdata/';
      const ocrText = await runOcr(imageFile, ['eng', 'chi_tra', 'chi_sim'], localLangPath, this.#document);
      console.log('Tesseract OCR Raw Text Result:\n', ocrText);

      this.#state.set(createProcessingAnalysisState('initializing'));
      const engine = await this.#engineService.getEngine();
      const conversationInstance = await engine.createConversation();
      if (!conversationInstance) {
        throw new Error('Failed to create a local Gemma 4 conversation session.');
      }
      conversation = conversationInstance;

      const extractedExpense = await this.runGemmaParsingWithRetry(conversationInstance, ocrText);
      this.#state.set(createCompletedAnalysisState());
      return extractedExpense;
    } catch (err) {
      console.error('Error during receipt analysis pipeline:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during receipt analysis.';
      this.#state.set(createFailedAnalysisState(errorMessage));
      throw err;
    } finally {
      this.#isAnalyzing = false;
      await safeDeleteConversation(conversation);
    }
  }

  /**
   * Private helper to execute Gemma JSON parsing and retry loops on OCR text.
   */
  private async runGemmaParsingWithRetry(
    conversationInstance: Conversation,
    ocrText: string,
  ): Promise<ExtractedExpense> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt = attempt + 1) {
      try {
        const generatedText = await this.runGemmaParsing(conversationInstance, ocrText);
        console.log(`Gemma 4 Raw Output (Attempt ${attempt}):`, generatedText);
        const cleanJson = sanitizeJsonString(generatedText);
        return JSON.parse(cleanJson) as ExtractedExpense;
      } catch (parseErr) {
        console.warn(`JSON parsing failed on attempt ${attempt}:`, parseErr);
        lastError = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
        if (attempt === 1) {
          this.#state.set(createProcessingAnalysisState('parsing'));
        }
      }
    }

    throw new Error(`Failed to parse valid JSON metadata after 2 attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Extracts clean generated text content from a multi-part or string response.
   */
  private extractResponseText(response: Message): string {
    if (typeof response.content === 'string') {
      return response.content.trim();
    }

    if (Array.isArray(response.content)) {
      return response.content
        .filter((part) => part && typeof part === 'object' && 'text' in part && typeof part.text === 'string')
        .map((part) => part.text)
        .join('')
        .trim();
    }

    return '';
  }
}
