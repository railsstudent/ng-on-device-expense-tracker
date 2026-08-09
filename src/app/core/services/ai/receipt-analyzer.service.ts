import { Service, inject, signal, computed, OnDestroy } from '@angular/core';
import { AiModelCacheService } from './ai-model-cache.service';
import { Engine, Conversation, Message } from '@litert-lm/core';
import { ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { RECEIPT_SYSTEM_PROMPT } from '@/core/consts/ai-prompt.const';
import { sanitizeJsonString } from '@/core/utils/json.utils';
import { runOcr } from '@/core/utils/ocr.utils';
import { ReceiptAnalysisState } from '@/shared/interfaces/receipt-analysis-state.interface';
import {
  createCompletedAnalysisState,
  createFailedAnalysisState,
  createIdleAnalysisState,
  createProcessingAnalysisState,
} from '@/core/utils/receipt-analysis-state.utils';

@Service()
export class ReceiptAnalyzerService implements OnDestroy {
  readonly #cacheService = inject(AiModelCacheService);

  // Single backing state signal
  readonly #state = signal<ReceiptAnalysisState>(createIdleAnalysisState());
  #engine: Engine | null = null;

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

  /**
   * Orchestrates the complete OCR and local AI parsing pipeline.
   * Extracts text, initializes Gemma 4 (cached on service lifecycle), prompts for JSON, and parses result.
   */
  public async analyzeReceipt(imageFile: File | Blob): Promise<ExtractedExpense> {
    // Proactively block concurrent execution triggers
    if (this.#isAnalyzing) {
      throw new Error('A receipt analysis is already in progress. Please wait for it to complete.');
    }

    this.#isAnalyzing = true;
    this.#state.set(createProcessingAnalysisState('initializing'));

    let conversation: Conversation | null = null;

    try {
      // 1. Step 1: Check if the AI model is cached locally
      const localBlobUrl = await this.#cacheService.getModelUrl();
      if (!localBlobUrl) {
        throw new Error(
          'Gemma 4 local weights are not cached in the browser yet. ' +
            'Please ensure the model is downloaded and cached before initiating receipt scans.',
        );
      }

      // 2. Step 2: Execute Optical Character Recognition (OCR) using the multilingual runOcr utility
      this.#state.set(createProcessingAnalysisState('scanning'));
      const ocrText = await runOcr(imageFile);

      // 3. Step 3: Initialize Google's on-device LiteRT-LM Engine if not already cached
      if (!this.#engine) {
        this.#state.set(createProcessingAnalysisState('initializing'));
        this.#engine = await Engine.create({
          model: localBlobUrl,
          mainExecutorSettings: {
            maxNumTokens: 2048,
          },
        });
      }

      if (!this.#engine) {
        throw new Error('Failed to initialize the local Gemma 4 WebGPU engine.');
      }

      // 4. Step 4: Create a safe conversation session
      conversation = await this.#engine.createConversation();
      if (!conversation) {
        throw new Error('Failed to create a local Gemma 4 conversation session.');
      }

      // 5. Step 5: Send the prompt and wait for the response
      this.#state.set(createProcessingAnalysisState('parsing'));
      const currentDateString = new Date().toISOString().split('T')[0];
      const promptText = `${RECEIPT_SYSTEM_PROMPT(currentDateString)}\n\nHere is the raw OCR text of the receipt:\n${ocrText}`;

      const response: Message = await conversation.sendMessage(promptText);
      const generatedText = this.extractResponseText(response);
      console.log('Gemma 4 Raw Output:', generatedText);

      // 6. Step 6: Parse and sanitize the JSON output
      const cleanJson = sanitizeJsonString(generatedText);
      const extractedExpense: ExtractedExpense = JSON.parse(cleanJson);

      this.#state.set(createCompletedAnalysisState());
      return extractedExpense;
    } catch (err) {
      console.error('Error during receipt analysis pipeline:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during receipt analysis.';
      this.#state.set(createFailedAnalysisState(errorMessage));
      throw err;
    } finally {
      // Release the concurrency lock and clean up transient session resources
      this.#isAnalyzing = false;
      await this.cleanupResources(conversation);
    }
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

  /**
   * Safely releases the conversation instance from VRAM and RAM memory.
   */
  private async cleanupResources(conversation: Conversation | null): Promise<void> {
    try {
      if (conversation) {
        await conversation.delete();
      }
    } catch (cleanupErr) {
      console.warn('Error releasing LiteRT-LM conversation session memory:', cleanupErr);
    }
  }

  /**
   * Lifecycle cleanup: Releases the engine instance from WebGPU memory when the application is destroyed completely.
   */
  public async ngOnDestroy(): Promise<void> {
    if (this.#engine) {
      try {
        await this.#engine.delete();
        this.#engine = null;
      } catch (cleanupErr) {
        console.warn('Error releasing LiteRT-LM engine resources during OnDestroy:', cleanupErr);
      }
    }
  }
}
