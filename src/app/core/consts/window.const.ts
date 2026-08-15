import { InjectionToken, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * WINDOW Injection Token: Returns the browser window object, or null in SSR
 */
export const WINDOW = new InjectionToken<Window | null>('GlobalWindowToken', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? window : null;
  },
});

/**
 * CACHE_STORAGE Injection Token: Returns window.caches, or null in SSR / unsupported environments
 */
export const CACHE_STORAGE = new InjectionToken<CacheStorage | null>('GlobalCacheStorageToken', {
  providedIn: 'root',
  factory: () => {
    const win = inject(WINDOW);
    return win && 'caches' in win ? win.caches : null;
  },
});

/**
 * NAVIGATOR Injection Token: Returns window.navigator, or null in SSR
 */
export const NAVIGATOR = new InjectionToken<Navigator | null>('GlobalNavigatorToken', {
  providedIn: 'root',
  factory: () => {
    const win = inject(WINDOW);
    return win ? win.navigator : null;
  },
});
