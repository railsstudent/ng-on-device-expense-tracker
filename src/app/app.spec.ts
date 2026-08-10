import '@angular/compiler';
import { signal } from '@angular/core';
import { App } from './app';
import { SqliteService } from './core/services/sqlite.service';
import { PwaService } from './core/services/pwa.service';

// Mock variables
let mockSqliteService: unknown;
let mockPwaService: unknown;

// Mock the inject function from @angular/core
vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return {
    ...actual,
    inject: vi.fn((token) => {
      if (token === SqliteService) {
        return mockSqliteService;
      }
      if (token === PwaService) {
        return mockPwaService;
      }
      return actual.inject(token);
    }),
  };
});

describe('App', () => {
  beforeEach(() => {
    mockSqliteService = {
      isConnected: signal(true),
    };
    mockPwaService = {
      status: signal('Active (Scope: /)'),
    };
  });

  it('should create the app and bind signal states', () => {
    const app = new App();
    expect(app).toBeTruthy();
    expect(app['dbStatus']()).toBe(true);
    expect(app['swStatus']()).toBe('Active (Scope: /)');
  });
});
