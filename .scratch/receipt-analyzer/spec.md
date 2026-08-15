# Specification: On-Device AI Receipt Analyzer & Expense UI

**Status**: approved
**Feature Slug**: `receipt-analyzer`
**Type**: Spec / PRD

---

## 1. Product Objective

Provide a premium, 100% private, and offline-first AI receipt scanner that allows users to upload a photo of a receipt, automatically extract key transaction details locally, review and correct the extracted values, and persist them securely into their browser's IndexedDB database.

This establishes a high-fidelity "Human-In-The-Loop" correction workflow that operates entirely offline, requiring zero external server calls and keeping all user transactions strictly private.

---

## 2. User Experience Flow

```mermaid
graph TD
    A[User Opens App] --> B[Top Navigation Bar Rendered]
    B --> C[Active Route: Extract Expense]
    C --> D{Model Cached?}
    D -- No --> E[Display Contextual Download Prompt inside Uploader]
    E --> F[User Clicks Download]
    F --> G[Display Fluid Progress Ring 0-100%]
    G --> H[Model Cached Successfully]
    D -- Yes --> I[Show Drag-and-Drop Image Uploader]
    H --> I
    I --> J[User Uploads/Drops Receipt Image]
    J --> K[Show High-Fidelity Image Preview on Left]
    K --> L[User Clicks Extract Expense]
    L --> M[Stage 1: Local Tesseract.js OCR WebWorker]
    M --> N[Stage 2: Local LiteRT-LM Gemma Parser]
    N --> O[Classify Category into Standard English Key]
    O --> P[Populate Right-Column Reactive Signals Form]
    P --> Q[User Reviews, Modifies, or Corrects Values]
    Q --> R{Form Valid?}
    R -- Yes --> S[User Clicks Save Expense]
    S --> T[Persist in IndexedDB via ExpenseService Facade]
    T --> U[Reset States & Display Premium Success Alert]
```

---

## 3. UI Layout & Component Architecture

We adopt a split-screen desktop layout, utilizing the **Facade Pattern** to decouple the presentation layers from backend services.

### 3.1 Shared Layout Components (`src/app/shared/ui/layout/`)

- **`NavigationComponent`**: A glassmorphic top header containing routing links for `Extract Expense` (Active) and `History & Insights` (Coming Soon).
- **`FooterComponent`**: A bottom footer displaying the branding copyright and tech stack: _"2026 On-device Expense Tracker. Built with Angular, Gemma 4, Litert.js & Tailwind."_

### 3.2 Master Split-Screen Layout (`ExtractExpenseComponent`)

- **Left Column (Image Zone - Width: 40% - 50%)**:
  - **`ModelDownloader`**: Contextual panel. If the local parser is not cached, displays: _"On-Device AI Engine Offline (~50MB)"_ with a **"Download AI"** button. Once clicked, shows an active progress ring. Once finished, hides itself or shows a small green badge. Network connectivity is evaluated once on load to enable or disable the button, avoiding redundant runtime background listeners since scanning itself is 100% offline-ready.
  - **`ImageUploader`**: Hover-animated card supporting file drag-and-drop. Accepts `image/*`. Once loaded, transitions to render a full-width high-fidelity image preview (`<img>` with fit-contain sizing).
    - **Section 3.2.1 File Size & Format Boundaries**: Enforces a strict **20MB maximum size limit** (configured as a localized constant) for dropped or selected images to prevent browser page out-of-memory thread crashes in local WebWorkers. Displays progressive loading feedback during file-reading operations (`onprogress` event bound) to ensure smooth transitions on large images and prevent visual jittering on small files.
  - **`OCR Trigger Button`**: A standalone primary button situated below the uploader card.
    - **Label**: `EXTRACT EXPENSE WITH AI`
    - **State**: Disabled by default. Enabled reactively only when the image loader emits a valid loaded image Base64 data stream.
    - **Interactions**: On click, triggers the local OCR parsing WebWorker and Gemma offline pipeline, transitioning to active loader states.

- **Right Column (Review Form - Width: 50% - 60%)**:
  - **`HumanInTheLoopForm`**: Rendered as a card with an active slate-200 border. Form inputs bind to type-safe Angular 22 Signals:
    - **Merchant Name**: Writable string signal. Requires length > 0.
    - **Amount**: Writable numeric signal. Must be non-null and greater than 0.
    - **Transaction Date**: Writable date-string signal (YYYY-MM-DD format).
    - **Category**: Writable string dropdown selector mapping stable English database keys to bilingual user labels:
      - `"dining"`: Dining & Meals / 餐飲
      - `"travel"`: Travel & Transport / 交通
      - `"office"`: Office & Software / 辦公
      - `"utilities"`: Utilities & Bills / 水電雜費
      - `"shopping"`: Shopping & Entertainment / 購物與娛樂
      - `"other"`: Other / 其他
  - **Action Button**: A prominent "Save Expense" primary button. Disabled if form validation fails. Clicking it invokes the `ExpenseService` to write the entry to IndexedDB, resetting the form and uploader.

### 3.3 Angular Router Integration

The application uses declarative, lazy-loadable router paths in `src/app/app.routes.ts` to manage UI view state:

- **Route `/extract`**: Maps to the `ExtractExpenseComponent` (Receipt upload and human-in-the-loop review form).
- **Route `/history`**: Maps to the future `ExpenseHistoryComponent` (Paginated grid list and local insights).
- **Root Route `/`**: Auto-redirects to `/extract` to present the scan tool immediately.
- **Main Shell**: `AppComponent` acts as a thin shell holding the global `<app-navigation>` with a `<router-outlet>` immediately below it to handle route resolution dynamically.

---

## 4. Technical Architecture

We adhere strictly to our decoupled repository patterns, introducing a feature-level state coordinator and shared layout directories:

```text
src/app/
├── core/
│   ├── consts/
│   │   └── app-database.const.ts       # DB Injection Token
│   └── services/
│       ├── database.service.ts         # Low-level IndexedDB CRUD operations
│       └── ai/
│           ├── ai-model-cache.service.ts
│           └── receipt-analyzer.service.ts
├── shared/
│   └── ui/
│       ├── components/
│       │   ├── model-downloader/       # Shared Engine Progress Component
│       │   └── image-uploader/         # Shared Drag-and-Drop + Preview Component
│       └── layout/
│           ├── navigation/             # Shared Top Navigation Navbar
│           └── footer/                 # Shared Bottom Copyright Footer
└── features/
    └── expense/
        ├── services/
        │   └── expense.service.ts      # Feature Facade (Coordinates state and data flow)
        └── components/
            ├── extract-expense/        # Layout Container
            └── review-form/            # Signals-based verification Form
```

### 4.1 Feature Facade (`ExpenseService`)

- Exposes readonly signals:
  - `currentExtraction`: Holds the active `ExtractedExpense` values.
  - `isProcessing`: Boolean indicating if OCR or AI is running.
  - `modelStatus`: Mapped from `AiModelCacheService`.
- Exposes methods:
  - `downloadModel()`: Triggers model caching.
  - `extractReceipt(file: File)`: Converts image to blob, runs Tesseract + Gemma, maps the parsed result to English category keys, and sets `currentExtraction`.
  - `saveExpense(corrected: ExtractedExpense)`: Invokes `DatabaseService.insert()`, clears the state, and shows success notifications.

---

## 5. Coding Standards & Linter Constraints

- **Curly Braces**: All `if` statement blocks must be wrapped in `{}`.
- **Incrementing**: No `++` or `--`. Use `i = i + 1;` or `x = x + 1;` in logical scripts.
- **Private Encapsulation**: Private class fields must use `#` prefixes; helper methods must use standard TypeScript `private`.
- **Absolute Imports**: Always use the `@/` path alias for any files inside `src/app/`.

---

## 6. Acceptance Criteria

- [x] Workspace compiles perfectly with zero TypeScript compiler or dependency injection warnings.
- [x] Model download is strictly **user-triggered** and displays a smooth contextual progress bar.
- [x] Uploading a photo renders a high-fidelity image preview on the left.
- [ ] Traditional Chinese receipt text is successfully analyzed, and mapped to English category keys.
- [ ] Human-in-the-loop review form accurately reflects the extracted signals, allowing manual overrides.
- [ ] Clicking "Save" persists the row into IndexedDB and resets the uploader UI gracefully.
- [x] Typography & Icons setup: Local `@fontsource` packages (`hanken-grotesk`, `inter`, `geist`, `material-symbols-outlined`) are installed and imported at the top of `src/styles.css` to enable 100% offline layout styling and iconography.
