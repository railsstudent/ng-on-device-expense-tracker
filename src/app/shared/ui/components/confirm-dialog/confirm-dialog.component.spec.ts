import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    // Mock HTMLDialogElement prototype methods that are missing in the Node/JSDOM testing environment
    if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    }

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the confirm dialog component', () => {
    expect(component).toBeTruthy();
  });

  describe('Seam 1: Visibility & Native DOM Seam', () => {
    it('should call showModal() on the native dialog element when open() is invoked', () => {
      const dialogNative = component['dialogElement']()?.nativeElement;
      if (dialogNative) {
        const spyShowModal = vi.spyOn(dialogNative, 'showModal');
        component.open();
        expect(spyShowModal).toHaveBeenCalled();
        spyShowModal.mockRestore();
      }
    });

    it('should call close() on the native dialog element when close() is invoked', () => {
      const dialogNative = component['dialogElement']()?.nativeElement;
      if (dialogNative) {
        const spyClose = vi.spyOn(dialogNative, 'close');
        component.close();
        expect(spyClose).toHaveBeenCalled();
        spyClose.mockRestore();
      }
    });
  });

  describe('Seam 2: Confirmation Action Seam', () => {
    it('should emit the confirmed output and close the dialog when confirm() is executed', () => {
      let emitted = false;
      component.confirmed.subscribe(() => {
        emitted = true;
      });

      const spyClose = vi.spyOn(component, 'close');

      component.confirm();

      expect(emitted).toBe(true);
      expect(spyClose).toHaveBeenCalled();
      spyClose.mockRestore();
    });
  });

  describe('Seam 3: Escape & Cancellation Seam', () => {
    it('should emit the cancelled output and close the dialog when cancel() is executed', () => {
      let emitted = false;
      component.cancelled.subscribe(() => {
        emitted = true;
      });

      const spyClose = vi.spyOn(component, 'close');

      component.cancel();

      expect(emitted).toBe(true);
      expect(spyClose).toHaveBeenCalled();
      spyClose.mockRestore();
    });

    it('should call cancel() and prevent default browser handling when the dialog native close event fires (onClose)', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as Event;

      const spyCancel = vi.spyOn(component, 'cancel').mockImplementation(vi.fn());

      component.onClose(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(spyCancel).toHaveBeenCalled();
      spyCancel.mockRestore();
    });
  });
});
