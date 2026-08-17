# Adopting CSS Container Queries for Component-Isolated Responsiveness

**Status**: accepted

We decided to standardize on **CSS Container Queries** (`@container`) across our presentation components (such as the data table and the verification form). This allows these components to dynamically adapt their padding, alignment, and layouts based on the **size of their parent container** rather than the global screen viewport, ensuring perfect layout isolation.

## Context & Rationale

1.  **The Limitation of Viewport Media Queries (`@media`)**:
    Traditional responsive design relies on viewport-based media queries (e.g., `@media (max-width: 640px)`). However, this couples component presentation directly to global screen widths. If components are loaded inside split-screen sidebars, dashboards, or expanding modals, they might have very little horizontal space even on a wide desktop screen, causing severe visual squishing.

2.  **Encapsulation & Component Modularity**:
    By letting components measure their own parent container width, they become fully modular. They can be safely dropped into any layout slot across the codebase and will automatically optimize their visual integrity for the available area.

3.  **Modern CSS Compatibility**:
    CSS Container Queries became **Baseline Widely Available** in 2023. They are natively supported by all modern browsers (Chrome 105+, Safari 16+, Firefox 110+, Edge 105+) with zero external dependencies, polyfills, or JavaScript event-listener overhead.

## Decided Layout Strategy

### 1. Data Table Stacked Card List (`HistoryResultTableComponent`)

- **Container Context**: Declare the `.table-wrapper` wrapper element as `inline-size`:
  ```css
  .table-wrapper {
    container-type: inline-size;
    container-name: table-container;
  }
  ```
- **Angular Host Sizing Containment (Critical Rule)**: Because Angular custom component host elements default to `display: inline` in browser rendering, any internal container queries nested within parent flex/grid containers will collapse to `0px` width. Therefore, we strictly require that all responsive container-aware custom components declare block-level containment on their host stylesheets:
  ```css
  :host {
    @apply block w-full;
  }
  ```
- **Isolated Mobile-Only Control Delegation Pattern**: When container dimensions fall below `600px`, table headers are hidden to protect vertical reading depth. To maintain user action agency (such as sorting data) without cluttering parent templates or violating Single Responsibility Principles, we delegate mobile-only controls to dedicated subcomponents (e.g. `HistoryMobileSortComponent`). These subcomponents register as children of the query-container, listen to container transitions (`@container table-container (max-width: 600px)`) to automatically toggle their own host rendering between `display: none` and `display: block`, and emit clean, standardized state changes (like `TableSortState`) to bind reactively to parent states.
- **Breakpoint (`600px`)**: Under `600px` container width, the table transitions to cards:
  - Hide table headers (`thead { display: none; }`).
  - Set rows and cells to `display: block`.
  - Bind `data-label="Column Name"` attributes to `<td>` cells and use `content: attr(data-label)` on `::before` pseudo-elements to float label names on the left, with actual values aligned on the right.

### 2. Human-In-The-Loop Review Form (`ReviewFormComponent`)

- **Container Context**: Declare `.review-details-card` as a query container:
  ```css
  .review-details-card {
    container-type: inline-size;
    container-name: form-container;
  }
  ```
- **Breakpoint (`480px`)**: Under `480px` container width, the card optimizes space:
  - Card padding reduces from `p-7` (28px) to `p-4` (16px) to maximize input field real estate.
  - Horizontal form rows (`.form-row` housing Transaction Date and Amount) stack vertically into full-width fields.
  - The action buttons (`.form-actions`) stack vertically using `flex-col-reverse`, positioning the primary **"SAVE EXPENSE"** button on top of **"CLEAR FORM"** for optimal, single-handed thumb-reach on mobile screen depths.

## Alternatives Considered

- **Tailwind `@media` viewport queries**: Rejected. Couples the layouts directly to screen widths, breaking responsive performance in dashboard multi-column viewports.
- **JavaScript-based ResizeObservers**: Rejected. Adds manual DOM event listeners, increases CPU overhead, and pollutes components with presentation logic.
