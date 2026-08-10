import { InjectionToken } from '@angular/core';
import { AppDatabase } from '@/core/db/app-database';

/**
 * Injection Token to access the AppDatabase singleton.
 */
export const APP_DATABASE_TOKEN = new InjectionToken<AppDatabase>('AppDatabase', {
  providedIn: 'root',
  factory: () => new AppDatabase(),
});
