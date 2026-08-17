import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { HistoryInsightsListComponent } from './history-insights-list.component';
import { Insight } from '@/shared/interfaces/insight.interface';
import { By } from '@angular/platform-browser';

describe('HistoryInsightsListComponent', () => {
  let fixture: ComponentFixture<HistoryInsightsListComponent>;

  const mockInsights: Insight[] = [
    { type: 'anomaly', title: 'Suspicious duplicate', message: 'Double burger purchase' },
    { type: 'saving', title: 'Potential saving', message: 'Cut down dining' },
    { type: 'trend', title: 'Rising electronics cost', message: 'More gadgets' },
    { type: 'general' as unknown as 'anomaly', title: 'Generic tip', message: 'Check budget' },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HistoryInsightsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryInsightsListComponent);
  });

  it('should render shimmers when status is thinking and list is empty', () => {
    fixture.componentRef.setInput('insights', []);
    fixture.componentRef.setInput('status', 'thinking');
    fixture.componentRef.setInput('showWelcomeBox', false);
    fixture.componentRef.setInput('isQueryUnsafe', false);
    fixture.detectChanges();

    const shimmers = fixture.debugElement.queryAll(By.css('.chat-shimmer-card'));
    expect(shimmers.length).toBe(2);
  });

  it('should render welcome box when showWelcomeBox is true', () => {
    fixture.componentRef.setInput('insights', []);
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('showWelcomeBox', true);
    fixture.componentRef.setInput('isQueryUnsafe', false);
    fixture.detectChanges();

    const welcome = fixture.debugElement.query(By.css('.chat-welcome-box'));
    expect(welcome).toBeTruthy();
    expect(welcome.nativeElement.textContent).toContain('Type a question above and click Ask Gemma');
  });

  it('should render dynamic cards with resolved icon names correctly', () => {
    fixture.componentRef.setInput('insights', mockInsights);
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('showWelcomeBox', false);
    fixture.componentRef.setInput('isQueryUnsafe', false);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.chat-insight-card'));
    expect(cards.length).toBe(4);

    // Verify resolved icon mapping (Seam 3)
    const icons = fixture.debugElement.queryAll(By.css('.material-symbols-outlined'));
    expect(icons[0].nativeElement.textContent.trim()).toBe('error'); // anomaly -> error
    expect(icons[1].nativeElement.textContent.trim()).toBe('payments'); // saving -> payments
    expect(icons[2].nativeElement.textContent.trim()).toBe('trending_up'); // trend -> trending_up
    expect(icons[3].nativeElement.textContent.trim()).toBe('info'); // fallback -> info
  });
});
