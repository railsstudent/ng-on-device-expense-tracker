# 11. Elevate History & Insights to a Dedicated Top-Level Feature and Adopt Feature-Scoped Interfaces

**Status**: accepted

We decided to refactor and migrate the "History & Insights" subcomponents from their coupled location under `src/app/features/expense/components/` into an independent, top-level feature directory at `src/app/features/history-insights/` with its own feature-scoped `interfaces/` folder.

## Context & Rationale

1. **Domain Isolation**:
   - `features/expense` is highly cohesive around transaction ingestion (OCR extraction and manual confirmation forms).
   - `features/history-insights` represents a completely separate domain focused on data search, interactive ledgers, and local AI analytics. Placing both in the same feature folder bloated the `expense` domain.

2. **Cross-Sibling Coupling Code Smell**:
   - Keeping all subcomponents flat under `expense/components/` meant they had to reach directly into sibling folders (e.g., `history-result-table` importing a UI state type from `history-insights/interfaces/`). This broke encapsulation.

3. **Avoiding Nesting Fatigue**:
   - While we could nest children under a single component (e.g. `history-insights/components/chat/`), this increases nesting depth and search fatigue in editors.
   - Creating a dedicated feature directory at `features/history-insights/` allows us to keep the component structure flat under `history-insights/components/` while cleanly sharing types from `history-insights/interfaces/`.

## Consequences

- **Clear File Tree**: All analytical subcomponents, services, and state types are self-contained inside `src/app/features/history-insights/`.
- **Clean Aliased Imports**: Imports are completely decoupled from peer components:
  `import { TableSortState } from '@/features/history-insights/interfaces/history-insights-state.interface';`
- **Zero Cross-Sibling Leakage**: No component folder depends directly on a flat sibling component folder.

## Relationships

- **Amends / Relocates**: [ADR 0007](0007-history-insights-screen.md) (Uses native `<dialog>` and Gemma 4 caching context).
- **Amends / Relocates**: [ADR 0008](0008-history-insights-state-localization.md) (Localizes pagination and sorting using `linkedSignal`).
