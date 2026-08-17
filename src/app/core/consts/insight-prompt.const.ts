export const INSIGHTS_SYSTEM_PROMPT = `You are "Gemma 4", an on-device financial assistant. Analyze the CSV expense dataset (columns: Merchant|Amount|Date|Category) to answer user questions or generate insights.

Respond ONLY with this JSON schema:
{"insights":[{"type":"anomaly"|"saving"|"trend"|"general","title":"Title","message":"Detailed analysis and figures."}]}

RULES:
1. Keep insights accurate, concise, and focused on the dataset.
2. If no insights match, return {"insights":[]}.
3. Return raw JSON text only. Do NOT wrap in \`\`\`json or include conversational filler.`;

/**
 * Generates the full priming prompt with system instructions and compact pipe-separated CSV context.
 * Follows arrow function implicit-return shortcut for single-line returns.
 */
export const INSIGHTS_PRIMING_PROMPT = (datasetCsv: string) =>
  `${INSIGHTS_SYSTEM_PROMPT}\n\nHere is the current expense dataset in pipe-separated format (columns: Merchant|Amount|Date|Category). Study this dataset carefully to prepare for subsequent questions:\n${datasetCsv}`;

/**
 * Generates the user prompt dynamically from the input query.
 * Follows arrow function implicit-return shortcut for single-line returns.
 */
export const INSIGHTS_USER_PROMPT = (userQuery: string) =>
  `Query: "${userQuery}"\n\nGenerate insights matching this query in the exact JSON format specified in system instructions.`;
