# Product Context: ng-on-device-expense-tracker

On-device receipt analyzer and expense tracker built with Angular, LiteRT.js, Gemma 4, and SQLite Wasm.

## Purpose & Goal

This application allows users to upload purchase receipts, analyze them **completely on-device** using local AI, extract structured transaction details, store them in a local SQLite database, and run custom queries to generate financial insights.

Everything runs entirely inside the user's browser—providing 100% offline functionality and total privacy with zero cloud server dependencies.

## Core Concepts (Glossary)

- **Receipt**: An uploaded image of a shopping or service receipt.
- **Receipt Analyzer**: On-device OCR and AI extraction engine using **LiteRT.js** and the **Gemma 4** model (`huggingface/lite-community/gemma4`).
- **Transaction**: The structured financial record extracted from a receipt, containing:
  - `merchant_name`: The business name.
  - `amount`: The total cost.
  - `transaction_date`: The date of purchase.
  - `items`: Individual line-items (optional).
- **On-Device Database (SQLite Wasm)**: A local SQL database stored inside the browser's persistent storage (Origin Private File System / OPFS) using SQLite Wasm.
- **Insight Engine**: A reporting module executing standard SQL queries against SQLite Wasm to generate trends, metrics, and visualization charts.

## Core User Workflows

1. **Upload & Capture**: User uploads a receipt image.
2. **On-Device Analysis**: LiteRT.js loads the Gemma 4 model locally to run structured inference, extracting merchant, amount, and date.
3. **Review & Confirm**: User validates the extracted transaction details.
4. **Persist (SQLite Wasm)**: Transaction is saved directly into the local SQLite database.
5. **Query Insights**: User runs predefined or custom SQL queries to view spending trends and analytics.
