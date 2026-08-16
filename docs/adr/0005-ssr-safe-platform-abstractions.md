# ADR 0005: SSR-Safe Platform Abstractions and Reactive Timers

## Status

Accepted

## Context

As we optimize the expense tracker for high performance, server-side rendering (SSR), and hybrid pre-rendering, we must ensure that browser-specific capabilities (such as PWA Service Workers, indexedDB, Web Workers, AI Model caching, and standard DOM timers) do not execute during server-side execution.

Executing browser-only APIs or persistent macros/microtasks (like standard `setTimeout` or raw RxJS `timer`) on the server causes:

1. **Compilation Errors**: Server-side node execution fails when trying to access `window`, `navigator`, or global storage APIs.
2. **Infinite SSR Hanging**: Open timers inside active zones prevent the Angular server-side platform from completing serialization, severely degrading Time To First Byte (TTFB).
3. **Wasted Resources**: The server attempts to spin up caching or model indexing systems that are completely useless outside the client's device context.

## Decision

We establish a global, DRY abstraction layer to guarantee SSR safety and decouple services from low-level platform checks:

1. **Root-Scoped `IS_BROWSER` Token**: A single InjectionToken is provided at root to determine the platform environment statically. Local usage of `@angular/common` `isPlatformBrowser(inject(PLATFORM_ID))` is forbidden in feature code.
2. **Decoupled `WINDOW` Token**: The global `WINDOW` token factory now references and evaluates `IS_BROWSER` dynamically to return `window` (client-side) or `null` (server-side).
3. **Shielded Service Execution**: High-level browser-only services (e.g., `PwaService`, `AiModelCacheService`) must guard their initialization block using `IS_BROWSER` injected internally.
4. **Reactive SSR-Safe Timers**: Any deferred UI updates (such as toast dismissal or auto-removal timers) must utilize RxJS `timer()` shielded by an explicit `IS_BROWSER` block to prevent macro-tasks from delaying SSR completion.

## Consequences

- **Improved TTFB**: Server rendering is guaranteed to complete instantaneously, as no background tasks are left open on the server.
- **Strict DRY Compliance**: Feature classes no longer need boilerplate code importing `@angular/common` or `PLATFORM_ID`.
- **Clean Test Boundaries**: Tests can safely override execution contexts simply by providing `{ provide: IS_BROWSER, useValue: true/false }` without needing complex boilerplate mocks.
