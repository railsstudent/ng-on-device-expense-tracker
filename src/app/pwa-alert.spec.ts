import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { PwaAlertComponent } from './pwa-alert';
import { PwaService } from '@/core/services/pwa.service';

describe('PwaAlertComponent', () => {
  let component: PwaAlertComponent;
  let fixture: ComponentFixture<PwaAlertComponent>;
  let updateAvailableSignal: WritableSignal<boolean>;
  let mockPwaService: {
    updateAvailable: WritableSignal<boolean>;
    reloadApp: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    updateAvailableSignal = signal(false);
    mockPwaService = {
      updateAvailable: updateAvailableSignal,
      reloadApp: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PwaAlertComponent],
      providers: [{ provide: PwaService, useValue: mockPwaService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the PwaAlertComponent', () => {
    expect(component).toBeTruthy();
  });

  describe('Seam 1: Visibility & linkedSignal State Seam', () => {
    it('should be hidden when updateAvailable is false', () => {
      expect(component.updateAvailable()).toBe(false);
      expect(component.isDismissed()).toBe(false);

      const alertContainer = fixture.nativeElement.querySelector('.pwa-alert-container');
      expect(alertContainer).toBeNull();
    });

    it('should be visible when updateAvailable is true and isDismissed is false', () => {
      updateAvailableSignal.set(true);
      fixture.detectChanges();

      expect(component.updateAvailable()).toBe(true);
      expect(component.isDismissed()).toBe(false);

      const alertContainer = fixture.nativeElement.querySelector('.pwa-alert-container');
      expect(alertContainer).not.toBeNull();
      expect(alertContainer.textContent).toContain('New version');
    });

    it('should hide when dismissAlert() is executed', () => {
      updateAvailableSignal.set(true);
      fixture.detectChanges();

      component.dismissAlert();
      fixture.detectChanges();

      expect(component.isDismissed()).toBe(true);
      const alertContainer = fixture.nativeElement.querySelector('.pwa-alert-container');
      expect(alertContainer).toBeNull();
    });

    it('should automatically reset isDismissed to false when updateAvailable toggles to a new state', () => {
      updateAvailableSignal.set(true);
      fixture.detectChanges();

      component.dismissAlert();
      fixture.detectChanges();
      expect(component.isDismissed()).toBe(true);

      // Simulating new update transition
      updateAvailableSignal.set(false);
      fixture.detectChanges();
      expect(component.isDismissed()).toBe(false);

      updateAvailableSignal.set(true);
      fixture.detectChanges();
      expect(component.isDismissed()).toBe(false);
    });
  });

  describe('Seam 2: Action Delegation Seam', () => {
    beforeEach(() => {
      updateAvailableSignal.set(true);
      fixture.detectChanges();
    });

    it('should delegate to pwaService.reloadApp when reloadApp() is called or reload button is clicked', () => {
      const reloadButton = fixture.nativeElement.querySelector('.pwa-alert-btn-reload') as HTMLButtonElement;
      expect(reloadButton).not.toBeNull();

      reloadButton.click();
      expect(mockPwaService.reloadApp).toHaveBeenCalledTimes(1);
    });

    it('should dismiss alert when dismiss button is clicked in template', () => {
      const dismissButton = fixture.nativeElement.querySelector('.pwa-alert-btn-dismiss') as HTMLButtonElement;
      expect(dismissButton).not.toBeNull();

      dismissButton.click();
      fixture.detectChanges();

      expect(component.isDismissed()).toBe(true);
      const alertContainer = fixture.nativeElement.querySelector('.pwa-alert-container');
      expect(alertContainer).toBeNull();
    });
  });
});
