import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { HistoryInsightsStatusComponent } from './history-insights-status.component';
import { By } from '@angular/platform-browser';

describe('HistoryInsightsStatusComponent', () => {
  let fixture: ComponentFixture<HistoryInsightsStatusComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HistoryInsightsStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryInsightsStatusComponent);
  });

  it('should render loading status correctly when status is initializing', () => {
    fixture.componentRef.setInput('status', 'initializing');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.chat-badge-initializing'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('Loading Gemma 4...');
  });

  it('should render active status correctly when status is ready', () => {
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.chat-badge-ready'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('Gemma 4: Active');
  });

  it('should render failed status with custom error tooltip when status is failed', () => {
    fixture.componentRef.setInput('status', 'failed');
    fixture.componentRef.setInput('error', 'WebGL context lost');
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.chat-badge-failed'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.getAttribute('title')).toBe('WebGL context lost');
    expect(badge.nativeElement.textContent).toContain('AI Error / 載入失敗');
  });
});
