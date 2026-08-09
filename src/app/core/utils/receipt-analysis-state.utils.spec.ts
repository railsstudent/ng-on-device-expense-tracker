import {
  createCompletedAnalysisState,
  createFailedAnalysisState,
  createIdleAnalysisState,
  createProcessingAnalysisState,
} from './receipt-analysis-state.utils';

describe('receiptAnalysisStateUtils', () => {
  describe('createIdleAnalysisState', () => {
    it('should return an idle state with isProcessing false and status idle', () => {
      const state = createIdleAnalysisState();
      expect(state).toEqual({
        status: 'idle',
        isProcessing: false,
      });
    });
  });

  describe('createProcessingAnalysisState', () => {
    it('should return a processing state with the given status and isProcessing true', () => {
      const state = createProcessingAnalysisState('scanning');
      expect(state).toEqual({
        status: 'scanning',
        isProcessing: true,
      });
    });
  });

  describe('createCompletedAnalysisState', () => {
    it('should return a completed state with status completed and isProcessing false', () => {
      const state = createCompletedAnalysisState();
      expect(state).toEqual({
        status: 'completed',
        isProcessing: false,
      });
    });
  });

  describe('createFailedAnalysisState', () => {
    it('should return a failed state with status failed, isProcessing false and the error message', () => {
      const state = createFailedAnalysisState('Network error');
      expect(state).toEqual({
        status: 'failed',
        isProcessing: false,
        error: 'Network error',
      });
    });
  });
});
