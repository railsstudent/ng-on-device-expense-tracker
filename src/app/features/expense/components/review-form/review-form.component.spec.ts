import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewFormComponent } from './review-form.component';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the review form component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values derived from models', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    const currentFormModel = compAny.formModel();
    expect(currentFormModel.merchantName).toBe('Coffee Roasters Inc.');
    expect(currentFormModel.amount).toBe(12.5);
    expect(currentFormModel.transactionDate).toBe('2026-05-14');
    expect(currentFormModel.category).toBe('dining');
    expect(compAny.verificationForm().valid()).toBe(true);
  });

  it('should update formModel when input models change dynamically via linkedSignal', () => {
    component.merchantName.set('New Merchant');
    component.amount.set(45.9);
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    const currentFormModel = compAny.formModel();
    expect(currentFormModel.merchantName).toBe('New Merchant');
    expect(currentFormModel.amount).toBe(45.9);
  });

  it('should mark form invalid if merchantName is empty or amount is non-positive', () => {
    component.merchantName.set('');
    component.amount.set(-5);
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    expect(compAny.verificationForm().invalid()).toBe(true);
  });

  it('should emit saved event on successful submit', async () => {
    let emitted: {
      merchantName: string;
      amount: number;
      transactionDate: string;
      category: string;
    } | null = null;

    component.saved.subscribe((val) => {
      emitted = val;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    compAny.onSubmit();

    // Wait for the simulated delay cleanly using standard promise
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    expect(emitted).toEqual({
      merchantName: 'Coffee Roasters Inc.',
      amount: 12.5,
      transactionDate: '2026-05-14',
      category: 'dining',
    });
  });
});
