import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HistorySearchFormComponent } from './history-search-form.component';
import { By } from '@angular/platform-browser';

describe('HistorySearchFormComponent', () => {
  let component: HistorySearchFormComponent;
  let fixture: ComponentFixture<HistorySearchFormComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HistorySearchFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorySearchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Validation', () => {
    it('should initialize with start date empty and end date as today', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const startInput = fixture.debugElement.query(By.css('input#startDate')).nativeElement;
      const endInput = fixture.debugElement.query(By.css('input#endDate')).nativeElement;

      expect(startInput.value).toBe('');
      expect(endInput.value).toBe(todayStr);

      const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(button.disabled).toBe(true);
    });

    it('should stay invalid and not emit when fields are incomplete', () => {
      const submitSpy = vi.fn();
      component.searchSubmit.subscribe(submitSpy);

      // Clear pre-filled endDate so form is incomplete
      const endInput = fixture.debugElement.query(By.css('input#endDate')).nativeElement;
      endInput.value = '';
      endInput.dispatchEvent(new Event('input'));

      const startInput = fixture.debugElement.query(By.css('input#startDate')).nativeElement;
      startInput.value = '2026-08-01';
      startInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(button.disabled).toBe(true);

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('submit', new Event('submit'));
      expect(submitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should become valid and emit values on valid submit click', () => {
      const submitSpy = vi.fn();
      component.searchSubmit.subscribe(submitSpy);

      const startInput = fixture.debugElement.query(By.css('input#startDate')).nativeElement;
      startInput.value = '2026-08-01';
      startInput.dispatchEvent(new Event('input'));

      const endInput = fixture.debugElement.query(By.css('input#endDate')).nativeElement;
      endInput.value = '2026-08-15';
      endInput.dispatchEvent(new Event('input'));

      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(button.disabled).toBe(false);

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('submit', { preventDefault: vi.fn() });

      expect(submitSpy).toHaveBeenCalledWith({
        startDate: '2026-08-01',
        endDate: '2026-08-15',
      });
      expect(component.dateRangeError()).toBe('');
    });

    it('should set an error and not emit when endDate is prior to startDate', () => {
      const submitSpy = vi.fn();
      component.searchSubmit.subscribe(submitSpy);

      const startInput = fixture.debugElement.query(By.css('input#startDate')).nativeElement;
      startInput.value = '2026-08-15';
      startInput.dispatchEvent(new Event('input'));

      const endInput = fixture.debugElement.query(By.css('input#endDate')).nativeElement;
      endInput.value = '2026-08-01';
      endInput.dispatchEvent(new Event('input'));

      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('submit', { preventDefault: vi.fn() });

      expect(submitSpy).not.toHaveBeenCalled();
      expect(component.dateRangeError()).toContain('End date cannot be earlier');
    });

    it('should set an error and not emit when date range exceeds 31 days', () => {
      const submitSpy = vi.fn();
      component.searchSubmit.subscribe(submitSpy);

      const startInput = fixture.debugElement.query(By.css('input#startDate')).nativeElement;
      startInput.value = '2026-08-01';
      startInput.dispatchEvent(new Event('input'));

      const endInput = fixture.debugElement.query(By.css('input#endDate')).nativeElement;
      endInput.value = '2026-09-10'; // 40 days difference
      endInput.dispatchEvent(new Event('input'));

      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('submit', { preventDefault: vi.fn() });

      expect(submitSpy).not.toHaveBeenCalled();
      expect(component.dateRangeError()).toContain('cannot exceed 1 month');
    });
  });
});
