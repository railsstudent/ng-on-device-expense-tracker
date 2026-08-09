import { InjectionToken, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * WINDOW Injection Token: Returns the browser window object, or null in SSR
 */
export const WINDOW = new InjectionToken<Window | null>('GlobalWindowToken', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      return window;
    }
    return null;
  },
});

/**
 * CACHE_STORAGE Injection Token: Returns window.caches, or null in SSR / unsupported environments
 */
export const CACHE_STORAGE = new InjectionToken<CacheStorage | null>('GlobalCacheStorageToken', {
  providedIn: 'root',
  factory: () => {
    const win = inject(WINDOW);
    if (win && 'caches' in win) {
      return win.caches;
    }
    return null;
  },
});
