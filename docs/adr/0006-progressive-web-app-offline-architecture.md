# ADR 0006: Progressive Web App (PWA) Offline Architecture

## Status

Accepted

## Context

A primary product requirement of our local expense tracker (as defined in `.scratch/expenses/spec.md` and `.scratch/receipt-analyzer/spec.md`) is to operate **100% offline-first**.

This means that even when a user is completely disconnected from the internet (e.g., in a flight, basement, or low-signal area), the web application must:

1. Load instantaneously in the browser.
2. Provide full interactive access to saved transaction history.
3. Allow image uploads, local OCR parsing (`Tesseract.js`), and offline AI inference (`Litert.js`/`Gemma`).
4. Persist newly added transactions securely into IndexedDB.

To achieve this, we need a robust client-side caching engine that serves the static application shell (HTML, CSS, JS, and local web fonts) instantly without hitting the network, and dynamically notifies the user when newer versions of the app are deployed.

## Decision

We adopt **Angular's official Service Worker engine (`@angular/service-worker`)** to handle Progressive Web App (PWA) capabilities and configure offline asset routing:

### 1. Unified Service Worker engine Configuration (`ngsw-config.json`)

We leverage a declarative configuration file (`ngsw-config.json`) to define caching standards. This avoids the high maintenance and risk of writing manual raw service worker scripts:

- **App Shell (`prefetch` group)**: Pre-caches essential startup files (`index.html`, root stylesheets, critical JS bundles, local web fonts like Geist, Inter, Hanken Grotesk, and Material Symbols ligatures). This ensures the app boots instantly on repeat visits without network roundtrips.
- **Assets and Graphics (`lazy` group)**: Lazily caches secondary resources, icons, and non-critical assets upon first access to minimize initial load bandwidth.

### 2. State-Driven `PwaService` Facade & Alert Lifecycle

We encapsulate Service Worker lifecycle monitoring inside a unified `PwaService` singleton located in `src/app/core/services/pwa.service.ts`:

- **Configurable Polling Lifecycle**:
  - Waits for initial application stabilization (`ApplicationRef.isStable`) before initiating update checks to avoid slowing down bootstrap.
  - Periodically polls for background bundle updates (`checkForUpdate()`) on an interval governed by the root `PWA_CHECK_INTERVAL` `InjectionToken`.
- **Signal-Based Notification**:
  - Exposes a reactive `updateAvailable` boolean signal derived from `SwUpdate.versionUpdates` (`VERSION_READY`).
  - Consumed by `PwaAlertComponent` (`app-pwa-alert`), which provides non-blocking "Reload" and "Dismiss" actions.
  - Manages `isDismissed` using Angular's `linkedSignal({ source: this.updateAvailable, computation: () => false })` to dismiss the prompt while automatically resetting when new updates arrive.

### 3. Separation of Concerns & SSR Shielding

- **IsBrowser Guard**: The service is shielded by the root-scoped `IS_BROWSER` InjectionToken (per ADR 0005). If executing on the server (SSR), the PWA service shuts down gracefully, returns a `"Not Supported (SSR Mode)"` status, and avoids registering background micro-tasks.
- **Isolated Testing Boundaries**: The `SwUpdate` service is mocked completely inside `pwa.service.spec.ts` using clean `Subject` mocks, verifying that version transitions, browser support checks, and initialization locks behave deterministically in test runners.

## Consequences

- **True Offline-First Capabilities**: Users can reload or open the application from their browser completely offline, achieving perfect zero-network shell boot times.

- **Improved UX**: Users are notified of new feature updates in real-time through non-disruptive notifications rather than encountering outdated cache states.
- **Production-Only Activation**: Angular's service worker compiles only under production configurations (`configuration=production`), preventing caching from interfering with the local development loops (`npm run start`).
- **Standardized Codebase**: Keeps service worker code dry, declarative, and decoupled from the layout templates.
