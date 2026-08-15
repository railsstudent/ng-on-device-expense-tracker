# Agent Guidelines: ng-on-device-expense-tracker

This file provides context, rules, and guidance for AI assistants working on this codebase.

## Project Structure & Coding Style

Follow this directory layout and architectural pattern when adding new files:

- **`src/app/core/`**: Core feature logic, singleton services, guards, and startup initializers.
- **`src/app/features/`**: Feature-specific components, routing, and modules (e.g., dashboard, settings).
- **`src/app/shared/`**: Reusable components, directives, pipes, domain models, and shared utilities.
  - **Shared Interfaces**: Shared/domain TypeScript interfaces and model files MUST be created inside `src/app/shared/interfaces/` as separate files using the naming convention `<domain-name>.interface.ts`. Never declare interfaces inline within service or utility files if they are reused or represent domain states.

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

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Domain documentation layout is single-context. See `docs/agents/domain.md`.
