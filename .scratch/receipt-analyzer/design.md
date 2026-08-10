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

# UI Design Guide: Aetheric Expense

A premium, localized, offline-first receipt analysis interface that allows seamless image uploads, offline AI classification (English keys mapped to Traditional Chinese bilingually), and interactive verification using Angular 22 Signals.

## 1. Core Brand Aesthetics

- **Theme**: Premium Developer-Minimalism with dynamic Glassmorphism.
- **Color Base**: Electric Indigo-600 (`#6366f1`) paired with authoritative Slate-950 (`#0f172a`) and deep-matte backgrounds (`#f8fafc`).
- **Typography**: Geometry-driven **Hanken Grotesk** for headings, readable **Inter** for body text, and structural monospaced **Geist** for labels/data properties.
- **Accents**: Soft-glowing gradients, borders with low-contrast, and subtle micro-interactions on clicks/hovers to wow the user.

### 1.1 Offline-First Font & Icon Installation (Critical Setup)

To guarantee 100% privacy, ultra-fast pre-loading, and completely offline execution, all typography and icon assets are packaged inside local `@fontsource` dependencies. You must install and import them as follows:

1. **Install Fontsource Packages**:
   Execute the following command in your terminal:

   ```bash
   npm install @fontsource/hanken-grotesk@5.2.8 @fontsource/inter@5.2.8 @fontsource/geist@5.2.9 @fontsource/material-symbols-outlined@5.2.45
   ```

2. **Add CSS Imports in `src/styles.css`**:
   Insert these imports at the **absolute top** of your global stylesheet (`src/styles.css`) to bundle the fonts and icons locally:

   ```css
   /* Fontsource Local Typefaces */
   @import '@fontsource/hanken-grotesk/index.css';
   @import '@fontsource/inter/index.css';
   @import '@fontsource/geist/index.css';

   /* Material Symbols Outlined Icons */
   @import '@fontsource/material-symbols-outlined/index.css';
   ```

3. **Material Symbols Usage**:
   Icons can be rendered natively as offline-safe ligatures in HTML, avoiding heavy runtime JS loads:
   ```html
   <span class="material-symbols-outlined">sync</span>
   <span class="material-symbols-outlined">cloud_upload</span>
   <span class="material-symbols-outlined">storefront</span>
   <span class="material-symbols-outlined">payments</span>
   <span class="material-symbols-outlined">calendar_today</span>
   <span class="material-symbols-outlined">sell</span>
   <span class="material-symbols-outlined">save</span>
   ```

---

## 2. Shared Layout Screens

### Navigation Bar (src/app/shared/ui/layout/navigation/)

- **Visuals**: Full-width top navigation header with a glassmorphic background (`backdrop-filter: blur(12px) bg-white/70`). Thin border-bottom of `#e2e8f0`.
- **Left Side**: Brand logo/title: `⚡ Aether Expense` (Hanken Grotesk, bold, slate-950, logo has active hover glow).
- **Center Menu**: Route Links:
  - `Extract Expense` (Active state: bold indigo-600 text, thin indigo-500 horizontal line below).
  - `History & Insights` (Muted state: slate-400 text, has a tiny coming-soon capsule badge: `#e0e7ff` container, indigo-800 text reading `"SOON"`).

### Sticky Footer (src/app/shared/ui/layout/footer/)

- **Visuals**: Elevated thin bottom bar, slate-50 background, `#e2e8f0` border-top.
- **Content**: Center-aligned, low-contrast text in Inter body-sm: _"© 2026 Aetheric On-device Expense Tracker. Built with Angular, Gemma 4, Litert.js & Tailwind CSS."_

---

## 3. Extract Expense Routed Shell (src/app/features/expense/components/extract-expense/)

- **Visuals**: Split-screen desktop grid (12-column fluid scale, 24px gutter). Centered in a `container-max` container, padded heavily on top and bottom.
  - **Left Area (Image Zone - 5 Columns)**: Displays model loader states and file upload preview.
  - **Right Area (Form Zone - 7 Columns)**: Renders the human-in-the-loop validation card.
- **Mobile Mode**: Stacked vertically, 100% width, side-margins of 16px.

---

## 4. Shared UI Widgets

### Model Downloader Component (src/app/shared/ui/components/model-downloader/)

- **Visuals**: Staggered container alert. Shows when model cache is empty:
  - Background: soft indigo-50 gradient.
  - Heading: `"On-Device AI Engine Offline"` (bilingual/subheading in Chinese: `"本機 AI 引擎未下載"`).
  - Button: `"Download Local AI Engine (~50MB)"` (indigo-600, rounded 8px, white text, active shadow on hover).
  - **Progress State**: Animated SVG circle loading ring (0% to 100% fill-dasharray transition) with numeric text overlaying in Geist font.

### Image Uploader Component (src/app/shared/ui/components/image-uploader/)

- **Visuals**: Rounded drag-and-drop zone. Padded with 48px, dashed slate-300 border.
  - **States**:
    - _Default_: Cloud icon, text _"Drag & Drop receipt photo here or click to browse"_, accepts image file types.
    - _Active Drag_: Border transitions to solid indigo-500, background fills with indigo-50.
    - _Preview Loaded_: Smoothly hides the dropzone dashed border, rendering a gorgeous, crisp, contain-fit preview `<img>` of the receipt with soft shadows.

---

## 5. Human-in-the-Loop Form (src/app/features/expense/components/review-form/)

- **Visuals**: Premium slate-200 bordered card holding the form layout.
- **Fields (Bilingual Form)**:
  1. **Merchant Name / 商家名稱**: Clear text input field, Geist font label, slate-200 border, blue glow on focus.
  2. **Amount / 金額**: Numeric input field with a prefix dollar sign `$`.
  3. **Transaction Date / 交易日期**: Date input selector.
  4. **Category / 類別**: Combobox dropdown displaying bilingual labels mapped to English keys:
     - `Dining & Meals / 餐飲` ➔ `dining`
     - `Travel & Transport / 交通` ➔ `travel`
     - `Office & Software / 辦公` ➔ `office`
     - `Utilities & Bills / 水電雜費` ➔ `utilities`
     - `Shopping & Entertainment / 購物與娛樂` ➔ `shopping`
     - `Other / 其他` ➔ `other`
- **Actions**:
  - **Save Expense Button**: Solid indigo-600 button with a transition effect. Displays a loader spinner if saving. Disabled if form validation is invalid (blank merchant, or zero/negative amount).
