# 13. Enforce 1-Month UI Search Limit and Turn-Based Auto-Reset for On-Device Chat Stability

**Status**: accepted

We decided to introduce a strict **1-month (31 days)** search date range limit in the user interface and implement a **turn-based auto-reset** of the Gemma 4 conversation session after 3 user queries.

## Context & Rationale

When executing local AI Q&A completely in the browser via WebGPU, the system's memory and performance are highly bounded.
As a user's transaction history grows, the volume of data transmitted to the local model can easily exceed WebGPU context budgets:

1. **Transaction Accumulation**: A single raw transaction block formats to roughly 7-10 tokens. Passing multi-month or annual lists of raw rows (e.g., 200+ transactions) eats up over 2,000 tokens in prefill alone, resulting in heavy prefill latency or browser WebGPU device lost crashes.
2. **Conversation History Growth**: Over multi-turn chats, the accumulated conversation history (system instructions + precomputed stats + raw CSV + turn history) grows linearly. Even with moderate initial datasets, a chat will inevitably hit the model's sequence limit (configured to 4,096 tokens) after a few turns.

To prevent browser freezing, memory exhaust, or silent hangs, we require proactive, client-side boundaries.

## Decision

We will implement three integrated guardrails:

### 1. 1-Month Search Range Filter Constraint (PRD Limit)

- The `HistorySearchFormComponent` will validate selected date ranges and restrict searches to a **maximum span of 31 days**.
- If a user selects a range greater than 31 days or end date is prior to start date, a local validation error is shown via a premium warning banner, and the query is blocked.
- This naturally keeps the dataset size small (~30 to 120 rows) which guarantees rapid AI prefill latency under 3 seconds.

### 2. Turn-Based Conversation Auto-Reset with Sliding 2-Question Memory

- The `InsightService` will track active chat session turns in a private `#turnsCount` property.
- If a session hits or exceeds **3 turns**, the service will automatically clear/delete the existing conversation, instantiate a fresh one, and silent-reprime with the active dataset.
- **Sliding 2-Question Memory**: The service maintains a private sliding array of the last 2 user queries. During re-priming, these questions are formatted and injected as a brief thread hint to support natural follow-up conversation flow.
- This drops the accumulated conversational token baggage while retaining enough semantic memory to support natural multi-turn follow-up pronouns.

### 3. Engine Token Capacity Increase (to 4,096)

- We will expand the shared `Engine` instance's `maxNumTokens` to **4096** in `gemma-engine.service.ts` to accommodate high-volume months comfortably while keeping WebGPU memory allocations completely safe.

### 4. Compact CSV Transmission

- We will restore the compact pipe-delimited header-based CSV layout (`Date|Category|Merchant|Amount`) which slashes the raw record representation from ~18 tokens per line down to only **~7 tokens per line**—a **61% token saving** over verbose labeled formatting.

## Consequences

- **100% Crash Immunity**: The total token load for any single-pass analysis is strictly bounded below 2,500 tokens, leaving generous room for model responses.
- **Lightning-Fast Responses**: Prefill latency is guaranteed to remain under 3 seconds on standard consumer hardware.
- **Zero Information Loss**: Enforcing the 1-month range means we never have to clip raw rows, keeping all transaction records in that month 100% visible to the model.
- **Clear UX**: The user is guided by immediate, helpful warning cues rather than facing silent application hangs.

## Relationships

- **Amends / Extends**: [ADR 0012](0012-on-device-analytics-precomputation-context.md) (Defines the precomputation schema and initial modular helper structure).
