import { createOnlineStatusSignal } from './network.utils';

describe('network.utils', () => {
  it('should return a signal defaulting to true if navigator is missing (SSR Safety Seam)', () => {
    const isOnline = createOnlineStatusSignal(null);
    expect(isOnline()).toBe(true);
  });

  it('should return a signal initializing to false if browser navigator is offline (Browser/Offline Seam)', () => {
    const mockNavigator = { onLine: false } as Navigator;
    const isOnline = createOnlineStatusSignal(mockNavigator);
    expect(isOnline()).toBe(false);
  });

  it('should return a signal initializing to true if browser navigator is online (Browser/Online Seam)', () => {
    const mockNavigator = { onLine: true } as Navigator;
    const isOnline = createOnlineStatusSignal(mockNavigator);
    expect(isOnline()).toBe(true);
  });
});
