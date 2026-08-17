# Port In-House Porter Stemmer for On-Device AI Safety Guardrail

**Status**: accepted

We decided to port the industry-standard Porter Stemmer algorithm directly into our repository as a first-party, strongly typed TypeScript utility, and use a hybrid tokenization strategy to normalize and validate natural language user queries against our client-side safety guardrails.

## Context & Rationale

1. **Resolving Guardrail False Positives on Inflections**:
   Natural language queries can have numerous grammatical variations (e.g., `"spending"`, `"spent"`, `"spends"`, `"spend"`; `"traveling"`, `"travel"`, `"trips"`). Hardcoding every single suffix variation into our whitelisted `FINANCE_KEYWORDS` array is fragile and unmaintainable.
   Without morphological normalization, questions like _"Do I spend too much on traveling?"_ would fail the safety check (triggering the off-topic warning), while _"Do I spend too much money on traveling?"_ would pass simply due to the presence of the word `"money"`.

2. **Ensuring a Clean, Private, and Offline-First Architecture**:
   The `Aether Expense` application is built to run 100% offline, private, and on-device (utilizing IndexedDB, Local WebGPU, and offline model caching).
   - **Why not an NPM Package?**: The open-source `stemmer` library has not been updated in 4 years. Installing stale packages introduces security vulnerabilities and npm audit risks.
   - **Why not a CDN ESM Import (esm.sh)?**: Importing packages dynamically over the internet via remote HTTPS URLs would break offline compilation and compilation-time bundling. It also introduces supply-chain risk and is not natively supported by the default Angular compiler.
   - **The Solution**: Directly porting the highly optimized, 70-line JavaScript Porter Stemmer algorithm into a strongly typed TypeScript file (`stemmer.ts`) inside our repository. This requires zero external dependencies, takes less than 1KB of space, and is 100% secure, offline-compatible, and owned by us.

3. **Hybrid "Lemmatizer + Porter Stemmer" Tokenization**:
   The Porter Stemmer is an algorithmic suffix-stripper (handling regular suffixes like `-ing`, `-ed`, `-s` perfectly). However, it does not understand semantic irregular variations (like `"spent"` -> `"spend"`, or `"bought"` -> `"buy"`).
   We combine the Porter Stemmer with a small irregular semantic lookup map to construct a high-performance, lightweight, client-side NLP tokenization engine.

## High-Level Pipeline Pseudo Code

The normalization and safety matching pipeline executes according to the following deterministic flow:

```typescript
/**
 * 1. Normalize Query:
 *    Convert the user query string to lowercase and trim any whitespace.
 *
 * 2. Tokenize:
 *    Split the normalized query string into an array of individual word tokens using whitespace regex:
 *    words = query.split(/\s+/)
 *
 * 3. Normalize & Stem (Each Token):
 *    For each word token:
 *    a. Strip any non-alphabetic characters (punctuation, numbers, special symbols).
 *    b. Irregular Lookup: Check if the cleaned token exists in IRREGULAR_LEMMAS lookup map.
 *       - If found: return the mapped root lemma (e.g., "spent" -> "spend", "bought" -> "buy").
 *    c. Algorithmic Porter Stemming: If not found, run the token through the Porter Stemmer rules:
 *       - e.g., "traveling" -> "travel", "spending" -> "spend", "categories" -> "category".
 *       - Return the resulting stem string.
 *
 * 4. Multi-Dimensional Safety Match:
 *    To allow the query, we check if any whitelisted FINANCE_KEYWORDS are present in the query:
 *    a. Phrase-Level Check (Direct Substring match):
 *       Does the entire raw query string contain any multi-word whitelisted phrases?
 *       - e.g., "how much", "what is".
 *       - If yes -> PASS guardrail.
 *    b. Token-Level Check (Stemmed matches):
 *       Do any of the stemmed individual user words match the whitelisted root keywords?
 *       - e.g., does stemmed word array contain "spend" or "travel"?
 *       - If yes -> PASS guardrail.
 *    c. Else:
 *       - Trigger off-topic warning and block prompt to save client WebGPU resources.
 */
```

## Consequences

- **Minimal Maintenance**: `FINANCE_KEYWORDS` can now list only clean, base-level root concepts (like `'spend'`, `'travel'`, `'shop'`).
- **Seamless Compile Integration**: The ported code compiles natively with Angular's Esbuild engine, requires no manual minification, has no separate `.d.ts` typing overhead, and integrates flawlessly with standard ESLint configurations.
- **Flawless Offline Support**: The safety checks run instantly in local memory in $O(N)$ linear time, with zero network dependencies.

## Impacted Files

The following files are introduced or updated under this architectural decision:

- **[`src/app/core/utils/stemmer.ts`](file:///Users/connieleung/Documents/ws_jsangular2/ng-on-device-expense-tracker/src/app/core/utils/stemmer.ts)**: Port of the Porter Stemmer algorithm in strongly typed TypeScript. _(New File)_
- **[`src/app/core/consts/ai-safety.const.ts`](file:///Users/connieleung/Documents/ws_jsangular2/ng-on-device-expense-tracker/src/app/core/consts/ai-safety.const.ts)**: WHitelisted keywords whittled down to simple root semantic lemmas. _(Updated File)_
- **[`src/app/core/utils/ai-safety.utils.ts`](file:///Users/connieleung/Documents/ws_jsangular2/ng-on-device-expense-tracker/src/app/core/utils/ai-safety.utils.ts)**: Tokenizer, irregular mapping lookup, stemming integrations, and matching flow. _(Updated File)_
