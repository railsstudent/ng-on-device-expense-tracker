# Specification: On-Device SQLite & Drizzle ORM Database Layer

## Problem Statement

Users need a way to store and query their expense transaction logs securely and permanently inside their local browser. Traditional web databases (like LocalStorage or generic IndexedDB) lack support for relational schemas, structured index queries, and compile-time type checking. Users want a type-safe, SQL-compliant local database that persists their data completely offline without any cloud server dependencies.

## Solution

Implement an on-device database layer utilizing **SQLite Wasm** (running inside a background Web Worker with OPFS SAH Pool storage) and expose a type-safe querying client on the Angular main thread using **Drizzle ORM's `sqlite-proxy`** driver. This provides a robust, SQL-compliant storage engine that supports standard SQL queries, auto-increments, and compile-time type-safety while keeping database I/O off the browser's UI thread.

## User Stories

1. As a developer, I want to define my database schema inside TypeScript using Drizzle core tables, so that my schema acts as the single source of truth for both types and migrations.
2. As an expense-tracking user, I want my transaction logs to be persisted in a local SQL database, so that my expenses are preserved across browser restarts and refreshes.
3. As an expense-tracking user, I want to view my transaction logs sorted by purchase date, so that I can easily review my spending history.
4. As an expense-tracking user, I want to add new expenses safely without risking SQL Injection, so that my database records remain intact and secure.
5. As an expense-tracking user, I want to query my transaction logs by category or cost thresholds, so that I can get targeted financial insights from my database.

## Implementation Decisions

### 1. Schema Definition (Drizzle ORM)

Define the schema inside `src/app/shared/db/schema.ts` with the following structure:

- **`expenses` table**:
  - `id`: Integer Primary Key, Auto-incremented.
  - `merchantName`: Text, non-null (corresponds to `merchant_name` in DB).
  - `amount`: Real, non-null.
  - `transactionDate`: Text, non-null (ISO Date String YYYY-MM-DD).
  - `category`: Text, non-null.

### 2. Encapsulated DB Service (Angular 22)

- Register `SqliteService` with Angular 22's `@Service()` decorator.
- Use a private `#db` property of type `SqliteRemoteDatabase` to hold the Drizzle client.
- Expose Drizzle through a safe, public read-only getter `get db()`. This getter will throw a clear exception if accessed before database initialization succeeds.

### 3. Background Web Worker

- Offload all SQLite execution (DB mounting and query execution) to `sqlite-custom-worker.js`.
- Communicate via asynchronous `postMessage` passing unique `messageId` keys to prevent blocking the UI thread.
- Use `installOpfsSAHPoolVfs` to establish high-performance local storage without requiring server-side COOP/COEP isolation headers.

## Testing Decisions

### 1. Schema Validation Tests

- Assert that inserting objects violating type definitions (e.g. string amount or null categories) are rejected by Drizzle/SQLite at runtime.
- Verify that `CREATE TABLE IF NOT EXISTS` is run automatically and runs successfully on empty databases.

### 2. Guard/Getter Tests

- Assert that calling `sqliteService.db` before `sqliteService.initialize()` has resolved successfully throws the expected uninitialized database exception.

## Out of Scope

- Local AI model processing, LiteRT.js, OCR, and receipt image uploading (these will be treated as higher-level features in a separate, subsequent specification).
- Synchronizing database files across multiple user devices or cloud servers.
