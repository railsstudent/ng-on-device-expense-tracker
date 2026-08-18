# Use Custom Projected Content Confirmation dialog & Caching Context for Insights

**Status**: accepted (Amended by [ADR 0011](0011-modular-feature-refactoring-history-insights.md) to relocate files from `features/expense/` to `features/history-insights/`)

We decided to implement the new "History & Insights" screen using native HTML5 `<dialog>` projection with `<ng-content>`, in-memory single-column RAM sorting, and a stateful context-cached local conversation session with the local Gemma 4 model.

## Context & Rationale

1. **Flexible Dialog Templates**:
   A reusable confirm dialog needs to render variable text structures (such as bold names or amount indicators). Emitting these as inputs requires writing heavy HTML template-string interpolation in TypeScript. Angular multi-slot projection (`<ng-content>`) allows compiling raw HTML within the parent component, keeping the dialog extremely simple.

   _Code Blueprint_:

   ```html
   <!-- inside confirm-dialog.component.html -->
   <dialog #nativeDialog class="confirm-modal">
     <header class="modal-header">
       <ng-content select="[dialog-title]"></ng-content>
     </header>
     <article class="modal-body">
       <ng-content select="[dialog-body]"></ng-content>
     </article>
     <footer class="modal-actions">
       <button (click)="close()">Cancel</button>
       <button (click)="confirm()">Confirm</button>
     </footer>
   </dialog>
   ```

2. **WebGPU Memory & Prompt Caching**:
   Re-transmitting the entire serialized expense list of hundreds of entries on every prompt is highly inefficient. It triggers heavy WebGPU Attention-Cache computation and stalls response generation. LiteRT-LM's `Conversation` instance maintains the chat history in memory. By sending a single "Priming Prompt" containing our current dataset at search execution, the model caches the context. Follow-up queries can be processed instantaneously.

   _Code Blueprint_:

   ```typescript
   // inside insight.service.ts
   public async primeContext(expenses: Expense[]): Promise<void> {
     this.#conversation = await this.#aiEngine.createConversation({
       systemPrompt: INSIGHTS_SYSTEM_PROMPT
     });
     const datasetJson = JSON.stringify(expenses);
     // Send dataset context to model memory once
     const stream = await this.#conversation.sendMessageStreaming(INSIGHTS_PRIMING_PROMPT(datasetJson));
     // Exhaust the priming stream silently in the background
     for await (const chunk of stream) { /* no-op */ }
   }
   ```

3. **RAM-Based Client Sorting**:
   IndexedDB does not support compound query indexing natively without significant structural overhead. Because on-device data scales are small, sorting the queried array in memory via an Angular computed signal is instantaneous and completely eliminates database Round-Trip latency.

4. **Continuous Streaming and Exception Yielding**:
   Swallowing parsing exceptions silently during streaming causes rendering stalls. Instead, we maintain the most recent successfully parsed insights response container (`lastValidResponse`). On every single stream chunk, we attempt a repair and parse. If an exception occurs, we catch it and immediately yield our best-effort `lastValidResponse` rather than continuing silently. This guarantees a stutter-free, real-time update cycle for the subscriber.

   _Code Blueprint_:

   ```typescript
   // inside insight.service.ts
   public async *streamInsights(userQuery: string): AsyncGenerator<InsightsResponse> {
     if (!this.#conversation) {
       throw new Error('AI session not primed.');
     }

     const stream = await this.#conversation.sendMessageStreaming(INSIGHTS_USER_PROMPT(userQuery));
     let buffer = '';
     let lastValidResponse: InsightsResponse = { insights: [] };

     for await (const chunk of stream) {
       buffer += chunk.content[0].text;
       try {
         const repairedJson = jsonRepair(buffer);
         const parsed = JSON.parse(repairedJson);
         if (parsed && parsed.insights) {
           lastValidResponse = parsed as InsightsResponse;
         }
         yield lastValidResponse;
       } catch {
         // Yield last successfully repaired response immediately on exception
         yield lastValidResponse;
       }
     }
   }
   ```

## Consequences

- **Rich Dialog Customization**: The `ConfirmDialogComponent` can be styled once and reused across different modules by simply projecting custom heading slots and body blocks.
- **Instantaneous AI Turns**: Follow-up questions to Gemma 4 execute within seconds since WebGPU attention weights do not need to be recomputed for the historical expense dataset.
- **Robust Reactive Flow**: The entire table rendering (Sorting, Filtering, Pagination) is driven cleanly by declarative, cascading Angular signals (`sortedExpenses`, `paginatedExpenses`) with zero imperative logic or race-conditions.
- **Modern Streaming UX**: Consuming the AI stream using an `AsyncGenerator` coupled with `json-repair` enables the rendering of structured insight cards progressively while Gemma is still thinking.
