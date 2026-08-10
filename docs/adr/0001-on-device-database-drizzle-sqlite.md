# On-Device SQLite Database with Drizzle ORM and `@Service()` Decorator

**Status**: superseded by [ADR 0003](0003-use-indexeddb-with-dexie.md)

We decided to use an on-device SQLite database via WebAssembly (OPFS SAH Pool VFS Web Worker) paired with Drizzle ORM's `sqlite-proxy` driver for safe, local-first transaction storage. To maintain robust software encapsulation and prevent uninitialized state access, the Drizzle database client is fully hidden inside the private `#db` field of the SQLite service and exposed through a safe `get db()` getter. Additionally, we use the newly introduced Angular 22 `@Service()` decorator over the legacy `@Injectable()` to register the service with modern dependency injection defaults.

## Considered Options

- **Direct Web Worker and raw SQL**: Extremely fast but vulnerable to SQL injection if not careful, and lacks autocomplete or model safety.
- **Node.js-based client-side database adapters**: Incapable of running directly in the browser's sandbox environment.
- **Standard public uninitialized property (`public db!`)**: Prone to runtime crashes if queries are executed before database initialization is complete.

## Consequences

- **Type Safety**: Developers get complete, autocompleted type checking on database fields at compile-time.
- **Security**: SQL Injection is completely prevented as Drizzle automatically compiles JS queries into secure parameter bindings.
- **Robustness**: Accessing `db` before initialization throws a descriptive runtime warning instead of crashing silently.
- **Angular 22 Optimization**: Incorporates modern, native `@Service` patterns out-of-the-box.
