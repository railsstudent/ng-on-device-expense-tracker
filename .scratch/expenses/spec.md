# Specification: On-Device IndexedDB & Dexie.js Database Layer

## Problem Statement

Users need a secure, zero-dependency, and highly concurrent way to store, update, and query their expense transaction logs locally inside their browser completely offline.

While SQLite WASM provides relational SQL, its single-threaded exclusive OS-level file locking (via OPFS SyncAccessHandles inside Web Workers) causes frequent locking collisions and crashes during development (HMR / browser hot-reloads) or when navigating between multiple tabs or ports (like port `4200` and `8080`) on `localhost`.

The storage layer must support native browser concurrency, have zero lock contention, and expose a clean, type-safe CRUD repository interface that enables fast date-range querying for local LLM analysis, while allowing for easy future migration to a Docker-hosted Relational Database (RDBMS).

## Solution

Implement an on-device database layer utilizing browser-native **IndexedDB** wrapped by **Dexie.js**. This provides a robust, lightweight, and concurrent object storage engine that supports asynchronous transactions and type-safe query interfaces on the main thread without requiring background Web Workers, WASM binaries, or custom server headers.

## User Stories

1. **Concurrent Multiple Tabs**: As an expense-tracking user, I want to open multiple browser tabs or switch local development ports without encountering database locking crashes or errors, so that my app works seamlessly under any browser layout.
2. **Date-Filtered Querying (AI Ready)**: As an expense-tracking user, I want to filter my transactions by date range (monthly or quarterly), so that I can send a compact ledger summary to my local Gemma model for spending insights.
3. **Complete Persistence**: As an expense-tracking user, I want my transaction logs to be persisted securely, so that my data is preserved perfectly across browser restarts, reloads, and computer crashes.
4. **No Boilerplate Bootstrap**: As a developer, I want the database and schema to be fully established _before_ the application boots up, so that my views and components can query the database instantly without having to write try/catch loaders or async spinner states in `ngOnInit()`.
5. **Easy Future Migration**: As a developer, I want my storage layer to be fully decoupled from the UI, so that I can easily migrate to a Docker-hosted PostgreSQL or MySQL database in the future by simply swapping the service's internal fetching code.

## Implementation Decisions

### 1. Database Schema & Models

- **Domain Model Extension**: Define the type-safe storage model by extending `ExtractedExpense` from `expense.interface.ts`:

  ```typescript
  export interface Expense extends ExtractedExpense {
    id?: number; // Auto-incremented primary key
  }
  ```

- **Dexie Definition**:
  - **Database Name**: `expenses_tracker_db`
  - **Stores**: `expenses: '++id, transactionDate, category'`
  - Properties like `merchantName` and `amount` are stored natively as decimal numbers and strings inside the JSON objects without needing explicit index registration.

### 2. File Organization (One Class Per File)

- **`AppDatabase`** ([`src/app/core/db/app-database.ts`](file:///Users/connieleung/Documents/ws_jsangular2/ng-on-device-expense-tracker/src/app/core/db/app-database.ts)): Contains exclusively the `Dexie`-extending database connection and schema class.
- **`DatabaseService`** ([`src/app/core/services/database.service.ts`](file:///Users/connieleung/Documents/ws_jsangular2/ng-on-device-expense-tracker/src/app/core/services/database.service.ts)): Contains exclusively the Angular `@Service()` service exposing explicit type-safe CRUD repository methods:
  - `select(): Promise<Expense[]>` (fetches all expenses)
  - `insert(expense: ExtractedExpense): Promise<number>` (returns the newly generated ID)
  - `update(id: number, expense: Partial<ExtractedExpense>): Promise<void>`
  - `delete(id: number): Promise<void>`
  - `selectByDateRange(startDate: string, endDate: string): Promise<Expense[]>`

### 3. Bootstrap Integration (`provideAppInitializer`)

- Add `DatabaseService` initialization to Angular's bootstrap chain in [`app.config.ts`](file:///Users/connieleung/Documents/ws_jsangular2/ng-on-device-expense-tracker/src/app/app.config.ts) using `provideAppInitializer(() => inject(DatabaseService).initialize())`.
- This establishes the database schema and validates the IndexedDB connection before the main component tree renders.

## Testing Decisions

### 1. Unit Testing Specifications

- Mock the global IndexedDB instance or Dexie calls inside `app.spec.ts` using clean Vitest mocking spies.
- Assert that all database initialization stages and query methods resolve cleanly under Vitest without loading real browser index structures.

### 2. Verification Self-Tests

- Implement a clean self-test in `AppComponent`'s `ngOnInit()` to verify IndexedDB inserts and selects, displaying successful transactions in the developer console.

## Out of Scope

- Syncing IndexedDB with a remote cloud server (this is purely on-device).
- Adding complex user authentication guards for database access.
