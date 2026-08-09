export type ReceiptAnalysisStatus = 'idle' | 'scanning' | 'initializing' | 'parsing' | 'completed' | 'failed';

export interface ReceiptAnalysisState {
  status: ReceiptAnalysisStatus;
  isProcessing: boolean;
  error?: string;
}
