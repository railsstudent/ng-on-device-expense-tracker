import { ReceiptAnalysisState, ReceiptAnalysisStatus } from '@/shared/interfaces/receipt-analysis-state.interface';

/**
 * Creates an idle analysis state.
 */
export function createIdleAnalysisState(): ReceiptAnalysisState {
  return {
    status: 'idle',
    isProcessing: false,
  };
}

/**
 * Creates a processing analysis state with a descriptive machine-readable status.
 *
 * @param status The machine-readable stage of the pipeline.
 */
export function createProcessingAnalysisState(status: ReceiptAnalysisStatus): ReceiptAnalysisState {
  return {
    status,
    isProcessing: true,
  };
}

/**
 * Creates a successfully completed analysis state.
 */
export function createCompletedAnalysisState(): ReceiptAnalysisState {
  return {
    status: 'completed',
    isProcessing: false,
  };
}

/**
 * Creates a failed analysis state with a raw error message.
 *
 * @param error Raw error message from the failure.
 */
export function createFailedAnalysisState(error: string): ReceiptAnalysisState {
  return {
    status: 'failed',
    isProcessing: false,
    error,
  };
}
