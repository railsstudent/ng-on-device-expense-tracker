import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HistoryInsightsChatComponent } from './history-insights-chat.component';
import { By } from '@angular/platform-browser';

describe('HistoryInsightsChatComponent', () => {
  let fixture: ComponentFixture<HistoryInsightsChatComponent>;
  let component: HistoryInsightsChatComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HistoryInsightsChatComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryInsightsChatComponent);
    component = fixture.componentInstance;
  });

  it('should initialize with inputs and empty query', () => {
    fixture.componentRef.setInput('state', { status: 'ready', error: null, streamingInsights: [] });
    fixture.componentRef.setInput('hasSearched', true);
    fixture.componentRef.setInput('hasExpenses', true);
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);
    expect(component.isSubmitDisabled()).toBe(true);
  });

  it('should detect unsafe prompts and show warning after debounce', async () => {
    fixture.componentRef.setInput('state', { status: 'ready', error: null, streamingInsights: [] });
    fixture.componentRef.setInput('hasSearched', true);
    fixture.componentRef.setInput('hasExpenses', true);
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    textarea.value = 'who won the soccer world cup?';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Immediately after typing, the signal value hasn't updated yet due to 300ms debounce
    expect(component.isQueryUnsafe()).toBe(false);

    // Wait for the 300ms debounce
    await new Promise((resolve) => setTimeout(resolve, 310));
    fixture.detectChanges();

    expect(component.isQueryUnsafe()).toBe(true);
    expect(component.isSubmitDisabled()).toBe(true);

    const guardrail = fixture.debugElement.query(By.css('.chat-guardrail'));
    expect(guardrail).toBeTruthy();
  });

  it('should emit safe query on form submit', async () => {
    fixture.componentRef.setInput('state', { status: 'ready', error: null, streamingInsights: [] });
    fixture.componentRef.setInput('hasSearched', true);
    fixture.componentRef.setInput('hasExpenses', true);
    fixture.detectChanges();

    const askGemmaSpy = vi.spyOn(component.askGemma, 'emit');

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    textarea.value = 'what is my highest category expense?';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Wait for the 300ms debounce
    await new Promise((resolve) => setTimeout(resolve, 310));
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('submit', new Event('submit'));
    fixture.detectChanges();

    expect(askGemmaSpy).toHaveBeenCalledWith('what is my highest category expense?');
  });
});
