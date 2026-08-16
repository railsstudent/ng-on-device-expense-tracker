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
    it('should initialize as empty and invalid', () => {
      const startInput = fixture.debugElement.query(By.css('input#startDate')).nativeElement;
      const endInput = fixture.debugElement.query(By.css('input#endDate')).nativeElement;

      expect(startInput.value).toBe('');
      expect(endInput.value).toBe('');

      const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(button.disabled).toBe(true);
    });

    it('should stay invalid and not emit when fields are incomplete', () => {
      const submitSpy = vi.fn();
      component.searchSubmit.subscribe(submitSpy);

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
    });
  });
});
