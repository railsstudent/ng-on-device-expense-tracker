import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtractExpenseComponent } from './extract-expense.component';

describe('ExtractExpenseComponent', () => {
  let component: ExtractExpenseComponent;
  let fixture: ComponentFixture<ExtractExpenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtractExpenseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtractExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the extract-expense shell component', () => {
    expect(component).toBeTruthy();
  });
});
