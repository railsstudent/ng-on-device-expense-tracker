import '@angular/compiler';
import { PwaService } from './pwa.service';
import { SwUpdate } from '@angular/service-worker';
import { PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';

// Setup local variables that our global inject mock will return dynamically inside tests
let currentPlatformId = 'browser';
let currentSwUpdate: unknown = null;

// Mock the inject function from @angular/core
vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return {
    ...actual,
    inject: vi.fn((token) => {
      if (token === PLATFORM_ID) {
        return currentPlatformId;
      }
      if (token === SwUpdate) {
        return currentSwUpdate;
      }
      return actual.inject(token);
    }),
  };
});

describe('PwaService', () => {
  let mockSwUpdate: {
    isEnabled: boolean;
    versionUpdates: Subject<{ type: string }>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let originalNavigator: unknown;

  beforeEach(() => {
    mockSwUpdate = {
      isEnabled: false,
      versionUpdates: new Subject(),
      checkForUpdate: vi.fn().mockResolvedValue(false),
      activateUpdate: vi.fn().mockResolvedValue(false),
    };
    currentPlatformId = 'browser';
    currentSwUpdate = mockSwUpdate;
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    // Always restore original navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

  describe('Platform Server (SSR) Safety', () => {
    it('should gracefully set status to SSR Mode and not touch navigator in Server platform', () => {
      currentPlatformId = 'server';
      const service = new PwaService();
      expect(service.status()).toBe('Not Supported (SSR Mode)');
    });
  });

  describe('Browser Support Verification', () => {
    it('should set status to Not Supported by Browser if navigator is missing serviceWorker', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const service = new PwaService();
      expect(service.status()).toBe('Not Supported by Browser');
    });
  });

  describe('Active Service Worker Tracking', () => {
    it('should set status to Active with scope if registration exists', async () => {
      const mockRegistration = { scope: '/test-scope/' };
      const getRegistrationMock = vi.fn().mockResolvedValue(mockRegistration);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: getRegistrationMock,
          },
        },
        writable: true,
        configurable: true,
      });

      const service = new PwaService();

      // Wait for background initialization to complete
      await flushMicrotasks();

      expect(getRegistrationMock).toHaveBeenCalled();
      expect(service.status()).toBe('Active (Scope: /test-scope/)');
    });

    it('should set status to Ready if serviceWorker is supported but no registration is found yet', async () => {
      const getRegistrationMock = vi.fn().mockResolvedValue(null);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: getRegistrationMock,
          },
        },
        writable: true,
        configurable: true,
      });

      const service = new PwaService();
      await flushMicrotasks();

      expect(service.status()).toBe('Ready (Registered upon Production Build)');
    });
  });

  describe('Service Worker Update Events', () => {
    it('should set status to Update Available if SwUpdate emits VERSION_READY', async () => {
      const getRegistrationMock = vi.fn().mockResolvedValue(null);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: getRegistrationMock,
          },
        },
        writable: true,
        configurable: true,
      });

      // Enable swUpdates
      mockSwUpdate.isEnabled = true;

      const service = new PwaService();
      await flushMicrotasks();

      // Emit VERSION_READY event
      mockSwUpdate.versionUpdates.next({ type: 'VERSION_READY' });

      expect(service.status()).toBe('Update Available! Please reload.');
    });
  });

  describe('Promise-Init Lock Security', () => {
    it('should await initialization before executing checkForUpdates', async () => {
      // Create a slow-resolving getRegistration to simulate slow boot
      let resolveSetup: ((value: unknown) => void) | undefined;
      const setupPromise = new Promise<unknown>((resolve) => {
        resolveSetup = resolve;
      });

      const getRegistrationMock = vi.fn().mockReturnValue(setupPromise);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: getRegistrationMock,
          },
        },
        writable: true,
        configurable: true,
      });

      mockSwUpdate.isEnabled = true;

      const service = new PwaService();

      // Call check for updates immediately on boot
      const checkPromise = service.checkForUpdates();

      // Assert that checkForUpdate mock has NOT been called yet because lock is held
      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();

      // Resolve background setup
      if (resolveSetup) {
        resolveSetup(null);
      }

      // Await checkPromise to finish
      const checkResult = await checkPromise;

      // Assert that checkForUpdate has now been successfully called after lock released
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
      expect(checkResult).toBe(false);
    });
  });
});
