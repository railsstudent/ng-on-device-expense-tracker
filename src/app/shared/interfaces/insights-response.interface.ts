import { Insight } from './insight.interface';

/**
 * Represents the full structured JSON container payload returned by the Gemma 4 streaming model.
 */
export interface InsightsResponse {
  insights: Insight[];
}
