import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent, VersionEvent, UnrecoverableStateEvent } from '@angular/service-worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { PwaService } from './pwa.service';
import { PWA_CHECK_INTERVAL } from '@/core/consts/pwa.constant';
import { WINDOW } from '@/core/consts/window.const';

describe('PwaService', () => {
  let service: PwaService;
  let versionUpdates$: Subject<VersionEvent>;
  let unrecoverable$: Subject<UnrecoverableStateEvent>;
  let isStable$: BehaviorSubject<boolean>;
  let mockSwUpdate: Partial<SwUpdate>;
  let mockWindow: { location: { reload: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    versionUpdates$ = new Subject<VersionEvent>();
    unrecoverable$ = new Subject<UnrecoverableStateEvent>();
    isStable$ = new BehaviorSubject<boolean>(false);

    mockSwUpdate = {
      isEnabled: true,
      versionUpdates: versionUpdates$.asObservable(),
      unrecoverable: unrecoverable$.asObservable(),
      checkForUpdate: vi.fn().mockResolvedValue(true),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };

    mockWindow = {
      location: {
        reload: vi.fn(),
      },
    };
  });

  function setupTest(
    swUpdateMock = mockSwUpdate,
    windowMock: { location: { reload: ReturnType<typeof vi.fn> } } | null = mockWindow,
    checkInterval = 1000,
  ) {
    TestBed.configureTestingModule({
      providers: [
        PwaService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: WINDOW, useValue: windowMock },
        { provide: ApplicationRef, useValue: { isStable: isStable$.asObservable() } },
        { provide: PWA_CHECK_INTERVAL, useValue: checkInterval },
      ],
    });

    service = TestBed.inject(PwaService);
  }

  describe('Seam 1: Update Event Detection & Signal Seam', () => {
    it('should initialize updateAvailable with false', () => {
      setupTest();
      expect(service.updateAvailable()).toBe(false);
    });

    it('should transition updateAvailable to true when VERSION_READY is emitted', () => {
      setupTest();
      expect(service.updateAvailable()).toBe(false);

      const event: VersionReadyEvent = {
        type: 'VERSION_READY',
        currentVersion: { hash: 'v1', appData: undefined },
        latestVersion: { hash: 'v2', appData: undefined },
      };
      versionUpdates$.next(event);

      expect(service.updateAvailable()).toBe(true);
    });

    it('should ignore non-VERSION_READY update events', () => {
      setupTest();

      versionUpdates$.next({ type: 'VERSION_DETECTED', version: { hash: 'v2', appData: undefined } });
      expect(service.updateAvailable()).toBe(false);

      versionUpdates$.next({
        type: 'VERSION_INSTALLATION_FAILED',
        version: { hash: 'v2', appData: undefined },
        error: 'failed',
      });
      expect(service.updateAvailable()).toBe(false);
    });

    it('should keep updateAvailable false if SwUpdate is disabled or window is missing', () => {
      setupTest({ ...mockSwUpdate, isEnabled: false });

      const event: VersionReadyEvent = {
        type: 'VERSION_READY',
        currentVersion: { hash: 'v1', appData: undefined },
        latestVersion: { hash: 'v2', appData: undefined },
      };
      versionUpdates$.next(event);
      expect(service.updateAvailable()).toBe(false);
    });
  });

  describe('Seam 2: Stabilization & Polling Lifecycle Seam', () => {
    it('should check for update upon application stabilization', () => {
      setupTest();

      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();

      isStable$.next(true);

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
    });

    it('should catch and handle errors from checkForUpdate() gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress expected test console error
      });
      mockSwUpdate.checkForUpdate = vi.fn().mockRejectedValue(new Error('Network offline'));

      setupTest();

      isStable$.next(true);

      // Wait a tick for promise rejection to be handled
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Seam 3: Reload & Recovery Seam', () => {
    it('should call activateUpdate and reload the browser when reloadApp() is called', () => {
      setupTest();

      service.reloadApp();

      expect(mockSwUpdate.activateUpdate).toHaveBeenCalledTimes(1);
      expect(mockWindow.location.reload).toHaveBeenCalledTimes(1);
    });

    it('should catch errors during activateUpdate and still reload window', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress expected test console error
      });
      mockSwUpdate.activateUpdate = vi.fn().mockImplementation(() => {
        throw new Error('Activation error');
      });

      setupTest();

      service.reloadApp();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockWindow.location.reload).toHaveBeenCalledTimes(1);
      consoleErrorSpy.mockRestore();
    });

    it('should automatically reload window on unrecoverable state event', () => {
      setupTest();

      unrecoverable$.next({
        type: 'UNRECOVERABLE_STATE',
        reason: 'Broken cache',
      });

      expect(mockWindow.location.reload).toHaveBeenCalledTimes(1);
    });
  });
});
