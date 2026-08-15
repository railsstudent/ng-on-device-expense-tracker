import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { DatabaseService } from './core/services/database.service';
import { PwaService } from './core/services/pwa.service';

describe('App', () => {
  let mockDatabaseService: Partial<DatabaseService>;
  let mockPwaService: Partial<PwaService>;

  beforeEach(async () => {
    mockDatabaseService = {
      isConnected: signal(true),
    } as unknown as Partial<DatabaseService>;

    mockPwaService = {
      status: signal('Active (Scope: /)'),
    } as unknown as Partial<PwaService>;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: PwaService, useValue: mockPwaService },
      ],
    }).compileComponents();
  });

  it('should create the app and bind signal states', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app['dbStatus']()).toBe(true);
    expect(app['swStatus']()).toBe('Active (Scope: /)');
  });
});
