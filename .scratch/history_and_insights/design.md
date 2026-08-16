---
name: Aetheric Expense Design System
colors:
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5f9'
  surface-container: '#e2e8f0'
  surface-container-high: '#cbd5e1'
  surface-container-highest: '#94a3b8'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  outline: '#64748b'
  outline-variant: '#cbd5e1'
  primary: '#6366f1'
  on-primary: '#ffffff'
  primary-container: '#e0e7ff'
  on-primary-container: '#3730a3'
  secondary: '#0f172a'
  on-secondary: '#ffffff'
  secondary-container: '#e2e8f0'
  on-secondary-container: '#1e293b'
  success: '#10b981'
  on-success: '#ffffff'
  success-container: '#d1fae5'
  on-success-container: '#065f46'
  warning: '#f59e0b'
  on-warning: '#ffffff'
  warning-container: '#fef3c7'
  on-warning-container: '#92400e'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  background: '#f8fafc'
  on-background: '#0f172a'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  code-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
  container-max: 1280px
  gutter: 24px
---

# UI Design Guide: History & Insights

A premium, localized, offline-first historical expense ledger and interactive AI assistant interface utilizing Angular standalone components, signals, native multi-slot projected dialogs, and a stateful, context-cached Gemma 4 conversation engine.

## 1. Core Brand Aesthetics

- **Theme**: Premium Developer-Minimalism with dynamic Glassmorphism.
- **Color Base**: Electric Indigo-600 (`#6366f1`) paired with authoritative Slate-950 (`#0f172a`) and deep-matte backgrounds (`#f8fafc`).
- **Typography**: Geometry-driven **Hanken Grotesk** for headings, readable **Inter** for body text, and structural monospaced **Geist** for labels/data properties.

---

## 2. History & Insights Routed Shell (src/app/features/expense/components/history-insights/)

- **Visuals**: Split-screen desktop grid (12-column fluid scale, 24px gutter). Centered in a `container-max` container, padded heavily on top and bottom.
  - **Left Area (Ledger Zone - 6 Columns)**: Displays date criteria selectors and the responsive, paginated expense log table.
  - **Right Area (AI Zone - 6 Columns)**: Renders the prompt input container, live connection indicators, and streaming insights cards.
- **Mobile Mode**: Stacked vertically, 100% width, side-margins of 16px.

### 2.1 Date Range Search Form (Bilingual Fields)

1. **Date From / 起始日期**: Date selector input, Geist font label, slate-200 border, blue glow on focus.
2. **Date To / 結束日期**: Date selector input.
3. **Action Button**: Primary indigo-600 button containing a material symbol `search` icon.

### 2.2 Expense Data Grid Table

- **Empty State**: Displays an offline calendar icon and centered text reading _"Select a date range above to load expense history / 請選擇日期範圍以載入交易紀錄"_.
- **Data Columns**: Merchant / 商家, Amount / 金額 (sky-blue bold text), Date / 交易日期, Category / 類別.
- **Hidden PK**: The `id` primary key is stored in memory but strictly excluded from HTML rendering.
- **Client-Side Sorting**: Clicking table headers triggers single-column RAM-based sorting. Up and down chevrons represent ASC/DESC states respectively.
- **Pagination Bar**: Shows a rows-per-page dropdown (options: `[5, 10, 20, 50]`, default: `10`) and dynamic navigation arrows (_"Page X of Y"_).

---

## 3. Shared Dialog Components

### Confirm Dialog Widget (src/app/shared/ui/components/confirm-dialog/)

- **Visuals**: Standalone, multi-slot projection modal wrapping native HTML5 `<dialog>`.
- **Structure**:
  - `dialog-title` slot: Renders context titles dynamically.
  - `dialog-body` slot: Renders details like merchant name and amount with danger notice alerts.
- **Interactive States**:
  - _Backdrop_: Glassmorphic blur (`backdrop-blur-md bg-brand-bg/75`) overlaying background features.
  - _Buttons_: Low-contrast slate cancel button, solid high-contrast rose-600 delete button.
