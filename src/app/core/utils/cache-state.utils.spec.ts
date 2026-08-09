import { createCachedState, createDownloadingState, createNotDownloadedState } from './cache-state.utils';

describe('cacheStateUtils', () => {
  describe('createCachedState', () => {
    it('should return a state representing a fully cached model', () => {
      const state = createCachedState();
      expect(state).toEqual({ status: 'cached', progress: 100 });
    });
  });

  describe('createDownloadingState', () => {
    it('should return a state representing active downloading with given progress', () => {
      const state1 = createDownloadingState(35);
      expect(state1).toEqual({ status: 'downloading', progress: 35 });

      const state2 = createDownloadingState(0);
      expect(state2).toEqual({ status: 'downloading', progress: 0 });

      const state3 = createDownloadingState(100);
      expect(state3).toEqual({ status: 'downloading', progress: 100 });

      const state4 = createDownloadingState(15.5);
      expect(state4).toEqual({ status: 'downloading', progress: 15.5 });
    });
  });

  describe('createNotDownloadedState', () => {
    it('should return a state representing a non-downloaded initial model', () => {
      const state = createNotDownloadedState();
      expect(state).toEqual({ status: 'not-downloaded', progress: 0 });
    });
  });
});
