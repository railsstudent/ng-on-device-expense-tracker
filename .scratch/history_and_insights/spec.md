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

### 3.1 Empty Table State & Pagination

- The table must remain hidden/unrendered, showing a centered placeholder, until `hasSearched` becomes `true`.
- Sorter: Single column sorting driven by an in-memory computed signal (`sortedExpenses`).
- Pagination: Driven by a reactive pipeline using `pageSize` (options: `[5, 10, 20, 50]`, default: `10`), `currentPage`, and computed total pages.

### 3.2 Custom Dialog Component with Projected Content

- Modal Component: `ConfirmDialogComponent` must utilize Angular multi-slot `<ng-content>` projection.
- Title slot: `<ng-content select="[dialog-title]">`
- Body slot: `<ng-content select="[dialog-body]">`
- The dialog wraps the native HTML5 `<dialog>` element and is styled with premium glassmorphism.

### 3.3 Stateful AI Engine & Caching

- **Priming phase**: When a new search is submitted, the previous session is destroyed. A new `Conversation` is created, and a minified JSON representation of the expenses dataset is sent. Gemma 4 caches the attention weights in memory and confirmation is returned.
- **Analytical phase**: Subsequent prompts are sent directly to the active, primed `Conversation` session without re-transferring the dataset.
- **Streaming Parser**: Use `chat.sendMessageStreaming(prompt)`. On each token chunk, run the accumulated buffer through `json-repair` to dynamically parse and populate partial insight cards.

---

## 4. Out of Scope

- Synchronizing IndexedDB across different browser vendor sync profiles.
- Supporting multi-column primary compound sorting.
