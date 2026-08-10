# Use IndexedDB with Dexie.js for On-Device Storage

**Status**: accepted

We decided to pivot from an on-device SQLite WASM database with Drizzle ORM to a browser-native **IndexedDB** database wrapped by **Dexie.js** for local-first transaction storage.

## Context & Rationale

1. **Multi-Tab Concurrency**:
   SQLite WASM on OPFS requires exclusive file-locking through `FileSystemSyncAccessHandle` inside background Web Workers. This causes frequent `createSyncAccessHandle` lock-contention crashes during development (HMR / browser hot-reloads) or whenever multiple browser tabs or local server ports (like port `4200` and `8080`) are active on `localhost` in the same browser session.
2. **Native Concurrency**:
   IndexedDB is natively built into all modern web engines. It supports fully concurrent, non-blocking asynchronous transactions across multiple browser tabs, origins, and reloads without any file locking conflicts or resource contention.
3. **Low Complexity & Performance**:
   Eliminating Web Assembly (SQLite WASM) and worker thread serialization (`postMessage`) reduces initialization overhead and startup latency, making the application boot instantly. It also cleans up more than 200 lines of complex locking-recovery, thread synchronization, and BroadcastChannel workarounds.
4. **Dexie.js Integration**:
   Dexie.js provides a high-performance, fluent, and type-safe query API that wraps IndexedDB, giving us clear and standard CRUD query constructs out of the box with zero boilerplate.

## Consequences

- **Zero-Lock Crashes**: Multiple tabs, hot-reloads, and ports on localhost can open and read/write concurrently with zero database locking errors.
- **No WASM Files**: Removed the need to deploy and cache heavy `.wasm` and `.mjs` assets.
- **No Server Headers**: Runs seamlessly on any local server or hosting platform without requiring custom COOP/COEP headers.
- **Decoupled Architecture**: Exposing clear asynchronous CRUD repository methods (`select`, `insert`, `update`, `delete`) decouples the UI from the database, making it extremely easy to migrate to a backend relational database (like a PostgreSQL Docker container) in the future.
- **Type Safety**: The database remains fully type-safe, bound directly to our shared `Expense` domain model.
