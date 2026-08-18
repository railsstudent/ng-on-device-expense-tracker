# 12. Precompute High-Fidelity Analytical Metrics as JSON Context to Resolve Local AI Math Limitations

**Status**: accepted

We decided to calculate detailed mathematical and aggregational summaries (totals, averages, monthly trends, extremes, and frequency) on-the-fly in standard TypeScript and pass them as a structured, minified JSON object inside the local Gemma 4 priming context.

## Context & Rationale

On-device models like Gemma 4 E2b operating client-side struggle with raw mathematical arithmetic and token-by-token floating-point additions over large, unstructured CSV lists. Furthermore, the local LiteRT-LM Web SDK does not support native tool calling, sandboxes, or local code execution to perform SQL/code calculations on-demand.

When users ask quantitative or analytical questions, the model frequently miscalculates or hallucinates:

- _"How much did I spend on transportation?"_
- _"Which category has the most spending?"_
- _"Breakdown my spending by category"_

To deliver 100% mathematically correct answers, we must pre-aggregate these metrics inside a standard TypeScript utility and feed them into the model's priming context.

## Decision

We will implement a hybrid priming context containing both a precomputed JSON block (`precomputedSummary`) and a raw CSV list of transactions.

### 1. Precomputed JSON Schema Shape

The precomputed block will be minified and conform to this precise structure:

```json
{
  "summary": {
    "totalSpending": 345.5,
    "transactionCount": 5,
    "averageTransactionAmount": 69.1,
    "topCategory": "Food & Dining"
  },
  "extremes": {
    "highest": {
      "merchant": "Uber",
      "amount": 120.0,
      "date": "2026-08-15",
      "category": "Transportation"
    },
    "lowest": {
      "merchant": "Arcade",
      "amount": 30.0,
      "date": "2026-08-11",
      "category": "Entertainment"
    }
  },
  "temporal": {
    "monthlySpending": {
      "2026-08": 345.5
    },
    "peakSpendingDayOfWeek": "Saturday"
  },
  "categoryBreakdown": {
    "Food & Dining": {
      "totalSpending": 150.0,
      "percentageOfTotal": 43.4,
      "transactionCount": 3
    }
  },
  "topMerchantsBySpending": [{ "merchant": "Uber", "totalSpending": 120.0 }],
  "mostFrequentMerchants": [{ "merchant": "Starbucks", "visitCount": 3 }]
}
```

### 2. Modular Calculator Functions

To maintain highly testable and clean code, we avoid single-pass monolithic loops. The precomputation logic inside `core/utils/insight-calculator.utils.ts` is divided into single-responsibility helpers:

- `aggregateExpenseData(expenses: Expense[]): AggregationContext`: Synthesizes raw category totals, merchant counts, monthly spans, day of week logs, and max/min extremes in a single loop.
- `buildSummary(...)`: Calculates total overall spending, count, average, and top category.
- `buildExtremes(...)`: Safe-constructs high/low extreme transaction details.
- `buildTemporalTrends(...)`: Computes monthly totals and identifies peak spending day of week.
- `buildCategoryBreakdown(...)`: Generates spending, exact percentage share, and counts grouped by category.
- `buildTopMerchants(...)`: Resolves the top 5 merchants based on aggregate spending sums.
- `buildMostFrequentMerchants(...)`: Resolves the top 5 merchants visited based on visit frequency.

### 3. Strict Math Guardrails & Fallbacks

Gemma is explicitly commanded in system instructions to defer all statistical or mathematical questions to the `precomputedSummary` JSON block.

If the user asks lookup questions that aren't precomputed (e.g., _"Show me transactions from Starbucks in August"_), Gemma falls back to searching the raw CSV dataset. If a complex math sum is required that is not precomputed, Gemma is instructed to list the matching raw rows but state clearly that it cannot guarantee the exact mathematical sum, completely preventing numerical hallucination.

## Consequences

- **Perfect Accuracy**: Standard category, merchant, and total spending queries are answered with 100% mathematical correctness.
- **Isolate Code/AI Concerns**: Business calculations are handled in pure TypeScript unit tests, keeping the AI services clean and lightweight.
- **Zero Qualitative Loss**: Granular lookup and search queries are fully supported via the raw CSV payload.
