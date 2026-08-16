import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewFormComponent } from './review-form.component';
import { ExtractedExpense } from '@/shared/interfaces/expense.interface';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;

    // Set a default required initialData input before the first detectChanges
    fixture.componentRef.setInput('initialData', {
      merchantName: 'Coffee Roasters Inc.',
      amount: 12.5,
      transactionDate: '2026-05-14',
      category: 'dining',
      isReceipt: true,
    } as ExtractedExpense);

    fixture.detectChanges();
  });

  it('should create the review form component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values derived from initialData input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    const currentFormModel = compAny.formModel();
    expect(currentFormModel.merchantName).toBe('Coffee Roasters Inc.');
    expect(currentFormModel.amount).toBe(12.5);
    expect(currentFormModel.transactionDate).toBe('2026-05-14');
    expect(currentFormModel.category).toBe('dining');
    expect(compAny.verificationForm().valid()).toBe(true);
  });

  it('should update formModel when input initialData changes dynamically via linkedSignal', () => {
    fixture.componentRef.setInput('initialData', {
      merchantName: 'New Merchant',
      amount: 45.9,
      transactionDate: '2026-06-20',
      category: 'travel',
      isReceipt: true,
    } as ExtractedExpense);
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    const currentFormModel = compAny.formModel();
    expect(currentFormModel.merchantName).toBe('New Merchant');
    expect(currentFormModel.amount).toBe(45.9);
  });

  it('should mark form invalid if merchantName is empty or amount is non-positive', () => {
    fixture.componentRef.setInput('initialData', {
      merchantName: '',
      amount: -5,
      transactionDate: '2026-06-20',
      category: 'travel',
      isReceipt: true,
    } as ExtractedExpense);
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    expect(compAny.verificationForm().invalid()).toBe(true);
  });

  it('should emit saved event on successful submit', () => {
    let emitted: ExtractedExpense | null = null;
    component.saved.subscribe((val) => {
      emitted = val;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compAny = component as any;
    compAny.onSubmit();

    expect(emitted).toEqual({
      merchantName: 'Coffee Roasters Inc.',
      amount: 12.5,
      transactionDate: '2026-05-14',
      category: 'dining',
    });
  });
});
