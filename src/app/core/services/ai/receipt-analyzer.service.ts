import { Service, inject, signal } from '@angular/core';
import { AiModelCacheService } from './ai-model-cache.service';
import * as Tesseract from 'tesseract.js';
import { Engine, Conversation, Message } from '@litert-lm/core';
import { ExtractedExpense } from '../../../shared/interfaces/expense.interface';

@Service()
export class ReceiptAnalyzerService {
  private readonly cacheService = inject(AiModelCacheService);

  // Private signals to communicate status to UI
  readonly #isProcessing = signal<boolean>(false);
  readonly #statusText = signal<string>('');

  // Public read-only signals
  public readonly isProcessing = this.#isProcessing.asReadonly();
  public readonly statusText = this.#statusText.asReadonly();

  /**
   * Orchestrates the complete OCR and local AI parsing pipeline.
   * Extracts text, initializes Gemma 4, prompts for JSON, cleans memory, and parses result.
   */
  public async analyzeReceipt(imageFile: File | Blob): Promise<ExtractedExpense> {
    this.#isProcessing.set(true);
    this.#statusText.set('Starting receipt analysis...');

    let engine: Engine | null = null;
    let conversation: Conversation | null = null;

    try {
      // 1. Step 1: Check if the AI model is cached locally
      this.#statusText.set('Checking local AI engine cache...');
      const localBlobUrl = await this.cacheService.getModelUrl();
      if (!localBlobUrl) {
        throw new Error(
          'Gemma 4 local weights are not cached in the browser yet. ' +
            'Please ensure the model is downloaded and cached before initiating receipt scans.',
        );
      }

      // 2. Step 2: Execute Optical Character Recognition (OCR) using Tesseract.js
      this.#statusText.set('Scanning receipt text (OCR stage)...');
      const ocrResult = await Tesseract.recognize(imageFile, 'eng');
      const ocrText = ocrResult.data.text;

      if (!ocrText || ocrText.trim() === '') {
        throw new Error(
          'OCR did not find any recognizable text in the receipt image. ' +
            'Please ensure the image has clear, legible text, and try again.',
        );
      }
      console.log('OCR text successfully extracted:', ocrText);

      // 3. Step 3: Initialize Google's on-device LiteRT-LM Engine using cached blob URL
      this.#statusText.set('Initializing Gemma 4 AI engine (WebGPU)...');
      engine = await Engine.create({
        model: localBlobUrl,
        mainExecutorSettings: {
          maxNumTokens: 2048,
        },
      });

      if (!engine) {
        throw new Error('Failed to initialize the local Gemma 4 WebGPU engine.');
      }

      // 4. Step 4: Create a safe conversation session
      conversation = await engine.createConversation();
      if (!conversation) {
        throw new Error('Failed to create a local Gemma 4 conversation session.');
      }

      // Formulate the structured prompting instructions for Gemma 4
      const currentDateString = new Date().toISOString().split('T')[0];
      const systemInstructions = `You are a financial metadata extraction system running on-device inside a web browser. Your sole task is to read the provided raw OCR text from a cash transaction receipt and organize it into a valid JSON object matching this schema:
{
  "merchantName": "The name of the vendor or store. Correct obvious typos. If unknown, use 'Unknown Merchant' (string)",
  "amount": Total paid amount (number, floating-point number, no symbols or letters, e.g., 24.50. If unknown, use 0.00)",
  "transactionDate": "Date of transaction in format 'YYYY-MM-DD' (string). If unknown, use '${currentDateString}'",
  "category": "One of these specific values: 'Food', 'Groceries', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Medical', or 'Others' (string)"
}

RULES:
- Do NOT output any introductory text, notes, or conversational greetings.
- Do NOT wrap your output in markdown formatting (like \`\`\`json).
- Respond ONLY with the clean, raw JSON string.
`;

      const promptText = `${systemInstructions}\n\nHere is the raw OCR text of the receipt:\n${ocrText}`;

      // 5. Step 5: Send the prompt and wait for the response
      this.#statusText.set('Gemma is thinking... Parsing receipt data...');
      const response: Message = await conversation.sendMessage(promptText);

      let generatedText = '';
      if (typeof response.content === 'string') {
        generatedText = response.content.trim();
      } else if (Array.isArray(response.content)) {
        let i = 0;
        while (i < response.content.length) {
          const part = response.content[i];
          if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
            generatedText = generatedText + part.text;
          }
          i = i + 1; // Strict increment syntax
        }
        generatedText = generatedText.trim();
      }

      console.log('Gemma 4 Raw Output:', generatedText);

      // 6. Step 6: Parse and sanitize the JSON output
      this.#statusText.set('Finalizing transaction metadata...');
      const cleanJson = this.sanitizeJsonString(generatedText);
      const extractedExpense: ExtractedExpense = JSON.parse(cleanJson);

      this.#statusText.set('Analysis completed successfully!');
      return extractedExpense;
    } catch (err) {
      console.error('Error during receipt analysis pipeline:', err);
      this.#statusText.set(`Analysis failed: ${(err as Error).message}`);
      throw err;
    } finally {
      // 7. Step 7: Clean up resources immediately to release WebGPU VRAM & system memory
      this.#statusText.set('Releasing WebGPU execution memory...');
      try {
        if (conversation) {
          await conversation.delete();
        }
        if (engine) {
          await engine.delete();
        }
      } catch (cleanupErr) {
        console.warn('Error releasing LiteRT-LM memory resources:', cleanupErr);
      }
      this.#isProcessing.set(false);
    }
  }

  /**
   * Sanitizes the raw LLM output, removing any markdown wrappers or conversational fluff.
   */
  private sanitizeJsonString(raw: string): string {
    let text = raw.trim();

    // Remove markdown code blocks if the model appended them
    if (text.startsWith('```')) {
      const firstLineEnd = text.indexOf('\n');
      if (firstLineEnd !== -1) {
        text = text.substring(firstLineEnd + 1);
      }
      if (text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      text = text.trim();
    }

    // Strip any leading text before the first '{' and trailing text after the last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return text;
  }
}
