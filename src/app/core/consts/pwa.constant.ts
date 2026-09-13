import { InjectionToken } from '@angular/core';

export const PWA_CHECK_INTERVAL = new InjectionToken<number>('PWA_CHECK_INTERVAL', {
  providedIn: 'root',
  factory: () => {
    const milliseconds = 1000;
    const seconds = 60;
    return 1 * seconds * seconds * milliseconds;
  },
});
