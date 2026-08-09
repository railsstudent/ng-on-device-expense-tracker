# On-Device AI Engine and Hybrid OCR-LLM Pipeline

**Status**: accepted

We decided to implement an on-device, sandboxed Web AI system using Google's `@litert-lm/core` WebGPU engine paired with the `gemma-4-E2B-it-litert-lm` (~2.4GB) model to analyze receipt details completely offline with 100% local privacy. Since the WebAssembly environment enforces a strict 32-bit **4GB RAM allocation limit**, larger models (like E4B or 12B) would trigger out-of-memory browser crashes. To overcome LiteRT-LM's current lack of browser-native vision executors, we employ a hybrid two-stage local pipeline: first running `tesseract.js` inside WebAssembly CPU threads for high-resolution text extraction (OCR), and then feeding the raw text to Gemma 4 E2B for semantic parsing and JSON structured formatting.

The model binary weights are progressively streamed, split into 128MB chunks, and cached locally inside the browser's Cache Storage API via a vendored `web-ai-model-proxy-cache` library managed by our `AiModelCacheService`. This service, along with `ReceiptAnalyzerService`, is namespaced under `src/app/core/services/ai/` and registered with the Angular 22 `@Service()` decorator. To support safe Server-Side Rendering (SSR) and testability, browser-specific APIs (`caches`, `window`) are injected via custom Dependency Injection (DI) tokens defined in `src/app/core/consts/window.const.ts`.

## Considered Options

- **Server-Side API Call (Cloud Models)**: Excellent performance but lacks offline execution capabilities, incurs high hosting/API costs, and raises user data privacy issues.
- **In-Browser Multimodal Execution (VLM)**: Strains browser WebGPU VRAM, consumes excessive visual tokens causing high prefill latency, and often fails due to browser memory allocation limits.
- **Gemma 4 E4B Model (~3.65 GB)**: Exceeds safe WebAssembly memory margins when combined with the active KV-cache and tokenizer, leading to frequent browser tab crashes.
- **Custom-built TS Stream Splitter**: High development complexity and risk of edge-case bugs with multi-part chunk reassembly. Standardizing on Jason Mayes' tested proxy-cache library saves development cost and guarantees reliability.

## Consequences

- **100% Local Privacy**: User transaction receipts are processed entirely on-device and never leave the browser.
- **Offline Capability**: Fully functional offline after the first visit with instant load speeds.
- **Resource Efficiency**: High semantic parsing accuracy with minimal CPU/GPU memory footprint, preventing browser tab crashes.
- **Code Quality**: Safe SSR pre-rendering and high unit testability through DI tokenization.
- **Aesthetic Binding**: Exposes high-fidelity, signal-based progress metrics (`status`, `progress`, `speed`) for a responsive, premium user experience.
