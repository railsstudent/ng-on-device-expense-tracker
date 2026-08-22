import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaAlertComponent } from './pwa-alert';
import { PwaService } from '@/core/services/pwa.service';
import { WINDOW } from '@/core/consts/window.const';
import { signal } from '@angular/core';

describe('PwaAlertComponent', () => {
  let component: PwaAlertComponent;
  let fixture: ComponentFixture<PwaAlertComponent>;
  let mockPwaService: {
    status: ReturnType<typeof signal<string>>;
  };
  let mockWindow: {
    location: {
      reload: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    mockPwaService = {
      status: signal<string>(''),
    };

    mockWindow = {
      location: {
        reload: vi.fn(),
      },
    };

    await TestBed.configureTestingModule({
      imports: [PwaAlertComponent],
      providers: [
        { provide: PwaService, useValue: mockPwaService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Seam 1: Dynamic Alert Visibility based on PWA Status', () => {
    it('should not render the alert container when status is empty', () => {
      mockPwaService.status.set('');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.pwa-alert-container')).toBeNull();
    });

    it('should render the alert container but no reload button when status is Checking...', () => {
      mockPwaService.status.set('Checking...');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.pwa-alert-container')).toBeTruthy();
      expect(compiled.querySelector('.pwa-alert-text')?.textContent).toContain('Checking...');
      expect(compiled.querySelector('.pwa-alert-btn-reload')).toBeNull();
    });

    it('should render the alert container and the reload button when status is Update Available! Please reload.', () => {
      mockPwaService.status.set('Update Available! Please reload.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.pwa-alert-container')).toBeTruthy();
      expect(compiled.querySelector('.pwa-alert-text')?.textContent).toContain('Update Available! Please reload.');
      expect(compiled.querySelector('.pwa-alert-btn-reload')).toBeTruthy();
    });
  });

  describe('Seam 2: Dismiss Action', () => {
    it('should clear the alert message and hide the alert container when dismiss button is clicked', () => {
      mockPwaService.status.set('Checking...');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dismissBtn = compiled.querySelector('.pwa-alert-btn-dismiss') as HTMLButtonElement;
      expect(dismissBtn).toBeTruthy();

      dismissBtn.click();
      fixture.detectChanges();

      expect(compiled.querySelector('.pwa-alert-container')).toBeNull();
    });
  });

  describe('Seam 3: Reload App Action', () => {
    it('should trigger window reload when reload button is clicked', () => {
      mockPwaService.status.set('Update Available! Please reload.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const reloadBtn = compiled.querySelector('.pwa-alert-btn-reload') as HTMLButtonElement;
      expect(reloadBtn).toBeTruthy();

      reloadBtn.click();

      expect(mockWindow.location.reload).toHaveBeenCalledTimes(1);
    });
  });
});
