# Localize Presentation State in Child Component & Use linkedSignal for Self-Healing Pagination

**Status**: accepted (Amended by [ADR 0011](0011-modular-feature-refactoring-history-insights.md) to relocate files from `features/expense/` to `features/history-insights/`)

We decided to completely localize presentational pagination, sorting, and active header state inside the child `<app-history-result-table>` component, and leverage Angular 19/22's state-of-the-art `linkedSignal` to automatically correct and clamp pagination boundaries when underlying records change.

## Context & Rationale

1. **Clean Separation of Concerns**:
   Previously, the parent `HistoryInsightsService` was polluted with presentational states such as `sortBy`, `sortAsc`, `currentPage`, and `pageSize`. This created duplicate sorting business pipelines in both the service and child table components, violating the Single Source of Truth principle. By localizing these signals inside the presenting table component, the parent service remains 100% focused on database loading, deletions, and executing AI prompt streams.

2. **Self-Healing State with `linkedSignal`**:
   Deleting the last remaining item on a page (e.g., page 3) causes the total pages to shrink. If the parent does not manually reset the page size and currentPage, the UI will display an empty page.
   Using Angular's native `linkedSignal` allows the component to automatically monitor the length of the raw `expenses` array input. The moment the array shrinks or grows, the `linkedSignal` recalculates the page limits on-the-fly and safely clamps the `currentPage` value back to the maximum valid boundary.

   _Code Blueprint_:

   ```typescript
   public readonly currentPage = linkedSignal<{ count: number; size: number }, number>({
     source: () => ({ count: this.totalCount(), size: this.pageSize() }),
     computation: (source, previous) => {
       if (!previous) {
         return 1;
       }
       const maxPages = Math.max(1, Math.ceil(source.count / source.size));
       return Math.min(previous.value, maxPages);
     }
   });
   ```

3. **Data-Driven Declarative Transitions (Map over Branching)**:
   Avoid using verbose, nested procedurally branched conditionals (`if/else`) inside services or component templates to toggle sequential sorting states. Instead, encapsulate cyclic sort state transitions inside a static lookup dictionary mapping, keeping sorting state transitions simple, readable, and highly maintainable.

   _Code Blueprint_:

   ```typescript
   public getNextSortDirection(current: SortDirection): SortDirection {
     const nextMap: Partial<Record<SortDirection, SortDirection>> = {
       none: 'asc',
       asc: 'desc',
     };
     return nextMap[current] ?? 'none';
   }
   ```

## Consequences

- **Pure Presentational Input Binding**: The parent component binds simple raw `[expenses]="vm.expenses()"` directly to the table tag. All `pageSizeChange`, `pageChange`, and custom sort listeners are completely eliminated from the parent markup.
- **Zero Parent State Pollution**: The parent service is entirely freed from having to coordinate boundary checks, page state resets, or intermediate transition properties.
- **Flawless Bounds Clamping**: Navigating back from other features (such as receipt extraction) starts the table state at page 1 cleanly, and any subsequent searches or deletions are automatically self-healed by the table's internal linked signal.
