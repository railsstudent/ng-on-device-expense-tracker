# Specification: History & Insights Feature (PRD)

## 1. Problem Statement

Users need a completely offline, highly interactive dashboard inside their browser to query, sort, and paginate historical expenses stored in their IndexedDB database. Additionally, they need to execute custom prompts against this data utilizing their local **Gemma 4** WebGPU model to extract financial insights, with clear, fast streaming updates.

---

## 2. User Stories

1. **Empty Initial State**: As a user, when I navigate to `/history`, the results table should be empty until I search for a date range, ensuring a clean, focused entrance to historical analysis.
2. **Responsive Date Search**: As a user, I want to input an inclusive date range (From/To) and click "Search" to fetch transactions matching my criteria instantly.
3. **High-Density Paginated Table**: As a user, I want to view my records organized into pages (options of 5, 10, 20, or 50 rows per page, defaulting to 10) so I am not overwhelmed by dense lists.
4. **Single-Column Interactive Sorting**: As a user, I want to click any table header (Merchant, Amount, Date, Category) to toggle ascending/descending order instantly.
5. **Secure Local Deletion**: As a user, I want to click a row's delete button to trigger a custom, premium modal dialog asking me to confirm or cancel the deletion.
6. **Stateful Conversation Caching**: As a user, I want to load my queried ledger data once and have Gemma 4 cache it. Then, I want to enter consecutive follow-up queries (e.g., _"How much was dining?"_ followed by _"What is my biggest expense?"_) without re-sending the whole dataset each time.
7. **Real-Time Insight Streaming**: As a user, I want to see the AI's structured response stream letter-by-letter (via `json-repair` and partial JSON parsing) so I don't have to wait for the entire response to compile.

---

## 3. Product & Functional Requirements

### 3.1 Empty Table State, Pagination & Cell Legibility

- The table must remain hidden/unrendered, showing a centered placeholder, until `hasSearched` becomes `true`.
- Sorter: Single column sorting driven by an in-memory computed signal (`sortedExpenses`).
- Pagination: Driven by a reactive pipeline using `pageSize` (options: `[5, 10, 20, 50]`, default: `10`), `currentPage`, and computed total pages.
- **Cell Truncation & Hover Legibility**: Because free-form merchant names and categories can be arbitrarily long, they must truncate gracefully with an ellipsis (`...`) inside narrow columns or small viewports. To maintain complete data accessibility, these cells must bind native `title` (or ARIA-compliant) tooltips on hover to reveal the full, original string seamlessly.
- **Container-Aware Responsive Layout (Stacked Cards)**: When the table wrapper is placed inside narrow spaces (container width < 600px), the layout must dynamically transition from a flat horizontal table grid to a vertical stack of high-fidelity "cards" (one per transaction row). This transition must be driven by **CSS Container Queries** (`@container`) rather than viewport media queries to preserve layout isolation. Cell labels (e.g. "Merchant", "Amount") must be rendered on the left of each item using HTML `data-label` attributes and CSS `::before` pseudo-elements, with the actual values aligned cleanly on the right.

### 3.2 Custom Dialog Component with Projected Content

- Modal Component: `ConfirmDialogComponent` must utilize Angular multi-slot `<ng-content>` projection.
- Title slot: `<ng-content select="[dialog-title]">`
- Body slot: `<ng-content select="[dialog-body]">`
- The dialog wraps the native HTML5 `<dialog>` element and is styled with premium glassmorphism.

### 3.3 Stateful AI Engine & Caching

- **Priming phase**: When a new search is submitted, the previous session is destroyed. A new `Conversation` is created, and a minified JSON representation of the expenses dataset is sent. Gemma 4 caches the attention weights in memory and confirmation is returned.
- **Analytical phase**: Subsequent prompts are sent directly to the active, primed `Conversation` session without re-transferring the dataset.
- **Streaming Parser**: Use `chat.sendMessageStreaming(prompt)`. On each token chunk, run the accumulated buffer through `json-repair` to dynamically parse and populate partial insight cards.
- **Prompt Safety & Relevance Guardrail**: To prevent brand liabilities and protect the user's client-side battery and WebGPU memory resources from wasteful processing of off-topic requests, the system must validate all user queries at the local gateway before invoking the LLM:
  - _Toxicity Shield_: Proactively block any query containing toxic or harmful language.
  - _Relevance Guard_: Verify the query's relevance to financial analytics, transactions, budgets, or categories. Unrelated topics (such as general knowledge, cooking recipes, etc.) must be blocked at the gateway, prompting a helpful off-topic user notification.

---

## 4. Out of Scope

- Synchronizing IndexedDB across different browser vendor sync profiles.
- Supporting multi-column primary compound sorting.
