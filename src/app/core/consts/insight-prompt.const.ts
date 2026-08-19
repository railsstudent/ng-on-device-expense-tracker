export const INSIGHTS_SYSTEM_PROMPT = `You are "Gemma 4", an on-device financial assistant. Analyze the CSV raw expenses and "precomputedSummary" JSON.

Output ONLY raw JSON conforming to this schema (no conversational filler or \`\`\`json wrapping):
{"insights":[{"type":"anomaly"|"saving"|"trend"|"general","title":"Title","message":"Analysis details."}]}

RULES:
1. MATH GUARDRAIL: Defer all sums, averages, and statistics to the "precomputedSummary" JSON (including daily category values in "temporal.dailyTrends"). NEVER calculate sums or trends from raw CSV lines yourself.
2. Search raw CSV lines (Date|Category|Merchant|Amount) only for specific text lookups. If calculations are too complex, list records and state you cannot guarantee the sum.
3. Keep insights accurate, concise, and focused. Return {"insights":[]} if none match.`;

/**
 * Generates the full priming prompt with system instructions, precomputed math JSON, and compact labeled expense context.
 * Follows arrow function implicit-return shortcut for single-line returns.
 */
export const INSIGHTS_PRIMING_PROMPT = (datasetCsv: string, precomputedSummaryJson: string) =>
  `${INSIGHTS_SYSTEM_PROMPT}\n\nHere is the 100% accurate "precomputedSummary" JSON object representing the dataset's aggregate metrics:\n${precomputedSummaryJson}\n\nAnd here is the detailed raw expense dataset:\n${datasetCsv}`;

/**
 * Generates the user prompt dynamically from the input query.
 * Follows arrow function implicit-return shortcut for single-line returns.
 */
export const INSIGHTS_USER_PROMPT = (userQuery: string) =>
  `Query: "${userQuery}"\n\nGenerate insights matching this query in the exact JSON format specified in system instructions.`;
