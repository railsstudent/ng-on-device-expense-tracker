You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

> [!IMPORTANT]
> This project has strict, repository-specific architectural rules. In addition to these guidelines, always follow the rules defined in [AGENTS.md](../AGENTS.md).

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- Never wrap an already-read-only signal inside a redundant `computed` block (e.g., avoid `status = computed(() => this.otherService.status())`). Always assign the signal directly to simplify the reactive dependency graph and reduce CPU overhead (e.g., use `status = this.otherService.status`).
- **DOM Manipulation and Side-Effects**:
  - Prefer native Angular template bindings (`[style]`, `[class]`) for all styling and updates.
  - **No `effect()` for DOM Manipulation**: Never use the standard `effect()` function to interact with or manipulate the DOM (doing so is unsafe, can cause layout thrashing, and crashes during Server-Side Rendering).
  - **Prefer `afterRenderEffect()` for DOM**: For manual DOM tasks (e.g., measuring dimensions, focusing inputs, or integrating non-Angular charts), always use `afterRenderEffect()` or `afterNextRender()`. Perform any DOM-write operations strictly inside the scheduled `write` phase callback.
  - **Prefer `linkedSignal()` for State Synchronization**: Never use `effect()` to reset or synchronize local signal states. Use `linkedSignal()` to cleanly reset, synchronize, or clamp values in response to other source signal changes.

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
- Do not specify services decorated with the custom `@Service()` decorator inside a component's local `providers: [...]` metadata array. Doing so overrides the DI container and instantiates a redundant, component-scoped copy instead of utilizing the container's global singleton.

## SSR & Browser Globals Protection

- **Avoid SSR Crashes**: Never access raw browser global objects (`window`, `document`, `navigator`, `localStorage`, etc.) directly inside components, services, or utilities. Doing so crashes Server-Side Rendering (SSR) or pre-rendering contexts.

- **Inject `DOCUMENT`**: Always inject Angular's built-in `DOCUMENT` token from `@angular/common` instead of referencing the global `document` keyword.

- **Composed Browser-Global Injection Tokens**: To safely reference browser-only global objects (such as `window`, `localStorage`, `sessionStorage`, `navigator`, etc.) without crashing during SSR:
  1. Define a global cached `IS_BROWSER` token to identify the platform context.
  2. **Compose other global tokens** by injecting `IS_BROWSER` into their factory callbacks.
  3. Explicitly type these composed tokens as `<Type> | null` so that TypeScript natively compile-checks and forces developers to verify existence before accessing them:

  ```typescript
  import { InjectionToken, inject, PLATFORM_ID } from '@angular/core';
  import { isPlatformBrowser } from '@angular/common';

  export const IS_BROWSER = new InjectionToken<boolean>('GlobalIsBrowserToken', {
    providedIn: 'root',
    factory: () => isPlatformBrowser(inject(PLATFORM_ID)),
  });

  /**
   * WINDOW: Returns the browser window object, or null in SSR
   */
  export const WINDOW = new InjectionToken<Window | null>('GlobalWindowToken', {
    providedIn: 'root',
    factory: () => (inject(IS_BROWSER) ? window : null),
  });

  /**
   * LOCAL_STORAGE: Returns the browser localStorage object, or null in SSR
   */
  export const LOCAL_STORAGE = new InjectionToken<Storage | null>('GlobalLocalStorageToken', {
    providedIn: 'root',
    factory: () => (inject(IS_BROWSER) ? window.localStorage : null),
  });
  ```

  _Usage:_

  ```typescript
  private readonly window = inject(WINDOW);
  private readonly storage = inject(LOCAL_STORAGE);

  public initTheme(): void {
    // TypeScript forces you to check for null, completely preventing SSR crashes!
    if (this.window && this.storage) {
      const savedTheme = this.storage.getItem('theme');
      const width = this.window.innerWidth;
    }
  }
  ```
