# Agent Guidelines: ng-on-device-expense-tracker

This file provides context, rules, and guidance for AI assistants working on this codebase.

## Project Structure & Coding Style

Follow this directory layout and architectural pattern when adding new files:

- **`src/app/core/`**: Core feature logic, singleton services, guards, and startup initializers.
- **`src/app/features/`**: Feature-specific components, routing, and modules (e.g., dashboard, settings).
- **`src/app/shared/`**: Reusable components, directives, pipes, domain models, and shared utilities.
  - **Shared Interfaces**: Core shared/domain TypeScript interfaces and model files (like `Expense` or `ToastMessage`) MUST be created inside `src/app/shared/interfaces/` as separate files using the naming convention `<domain-name>.interface.ts`. Never declare interfaces inline within service or utility files.
  - **Component & Feature-Scoped Interfaces**: Interfaces that are strictly scoped to a specific component or feature-tree (like table configurations or local view states) should be organized inside an `interfaces/` subfolder located directly within that component or feature directory (e.g. `src/app/features/expense/components/history-insights/interfaces/`). Use clean absolute aliases (e.g. `@/features/expense/...`) for imports to avoid relative paths.

### Core Coding Style & Syntax Constraints

When writing or refactoring TypeScript code, you MUST adhere to the following rules:

1. **Private Encapsulation**:
   - **Private Backing Variables & Signals**: Always use JavaScript native `#` prefixes (e.g. `readonly #state = signal(...)`, `#engine: Engine | null = null`).
   - **Private Helper Methods**: Always use standard TypeScript `private` modifiers (e.g. `private runOcr(...)`, `private cleanupResources(...)`).
2. **If Statement Bodies**: Every `if` statement block must be enclosed in curly braces `{}` (no dangling `if` statements).
3. **Loop & Mathematical Increments**: Never use `++` or `--` increment/decrement operators. Write explicit re-assignments instead (e.g. `i = i + 1;` or `x = x + 1;`).
4. **Strict Type Safety**: Explicit `any` type usage is strictly forbidden in application, service, or spec files due to strict ESLint rules. If an absolute edge-case warrants its usage, it must be explicitly suppressed with an `/* eslint-disable */` or `// eslint-disable-next-line` comment. Use standard types, `unknown`, or double-casting (`as unknown as T`) to ensure linter and type-safety compliance.
5. **Single-line Function & Computed Signal Shortcuts**: For functions or computed signals that fit on a single line, you MUST use the arrow function implicit-return shortcut (i.e. omit the curly braces, `return` keyword, and semicolon inside the function body).
   - **Correct**: `public readonly status = computed(() => this.#state().status);`
   - **Incorrect**: `public readonly status = computed(() => { return this.#state().status; });`
6. **Implicit Signal Type Inference**: Never specify explicit type parameters on signals when they can be cleanly inferred from their initialization values (e.g., use `readonly isDragging = signal(false);` instead of `readonly isDragging = signal<boolean>(false);`).
7. **Absolute Path Aliases**: Never use relative import paths (e.g. `../` or `../../`) inside application, service, component, layout, utility, or spec files. Always use absolute path aliases that start with `@/` to import local project files (e.g. `import { Service } from '@/core/services/...'`).
8. **Tailwind CSS v4 Component Styling**: Always prioritize Tailwind CSS v4 `@apply` utility classes over raw vanilla CSS inside component-scoped stylesheets. To compile correctly in isolation, you MUST prepend an explicit `@reference` directive pointing relatively to the global `src/styles.css` stylesheet file.
   - **Correct**:

     ```css
     @reference "../../../../../styles.css";
     .toast-container {
       @apply fixed top-6 right-6 flex flex-col;
     }
     ```

9. **Signal Localization & Stateless Parent Services**: Presentation-only variables (such as active sorting columns, sort direction, page size, current page numbers, and modal pending/open selections) must reside locally inside the presenting component or its stateless view-service helpers. They must not pollute parent data-loading services.
10. **Self-Healing State with `linkedSignal`**: Whenever a local view signal (such as `currentPage` or `pageSize`) depends on or must be clamped when a bound input array (such as `expenses`) changes, always use Angular's `linkedSignal` to handle boundary-clamping cleanly and reactively instead of manual setters or intermediate states.
11. **Map-Based Cyclical State Transitions**: Avoid using verbose, procedurally branched conditional logic chains (e.g. `if/else`) to handle sequential state loops (such as none -> asc -> desc -> none). Always use static, typed lookup maps/dictionaries (`Partial<Record<T, T>>`).
12. **Signal Forms (`@angular/forms/signals`) Constraint**: All forms in this repository MUST be built using Angular's modern, reactive Signal Forms (`@angular/forms/signals`). The use of legacy Reactive Forms (`FormGroup`, `FormControl`, `FormBuilder` from `@angular/forms`) or template-driven forms is strictly prohibited. This guarantees optimal performance, native reactivity, and a unified state management architecture.
13. **Direct Read-Only Signal Assignments**: Never wrap an already-read-only signal inside a redundant `computed` block (e.g., avoid `status = computed(() => this.otherService.status())`). Always assign the signal directly to simplify the reactive dependency graph and reduce CPU overhead (e.g., use `status = this.otherService.status`).
14. **Avoid Redundant Component Providers**: Do not specify services decorated with the custom `@Service()` decorator inside a component's local `providers: [...]` metadata array. Doing so overrides the DI container and instantiates a redundant, component-scoped copy instead of utilizing the container's global singleton.
15. **Unified Visual Theme & Page Shells**: All newly created pages must use the global `.app-page-shell` wrapper class and adhere strictly to the standard **Premium Light Theme (slate-50 base, white card-glass, text-slate-800, border-slate-200)**. Under no circumstances should pages define their own localized dark background overrides or absolute `min-h-screen` height properties.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Domain documentation layout is single-context. See `docs/agents/domain.md`.
