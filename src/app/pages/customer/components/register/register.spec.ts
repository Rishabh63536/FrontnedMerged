import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterComponent } from './register';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Login } from '../../../../core/services/login';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  // 1. Vitest Mock
  const mockAuthService = {
    register: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default to a successful API response
    mockAuthService.register.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule, RouterTestingModule],
      providers: [
        { provide: Login, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    
    // Inject real router and spy on it
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    
    fixture.detectChanges();
  });

  // --- 1. Initialization ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- 2. Form Logic & Validation ---

  it('should abort submission if the form is invalid', () => {
    const invalidForm = { valid: false } as NgForm;
    
    component.register(invalidForm);

    expect(component.submitting).toBeFalsy();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should abort and show error if passwords do not match', () => {
    const mismatchedForm = {
      valid: true,
      value: { password: 'password123', confirmPassword: 'differentPassword' }
    } as NgForm;
    
    component.register(mismatchedForm);

    expect(component.errorMessage).toBe('Passwords do not match.');
    expect(component.submitting).toBeFalsy();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  // --- 3. API Integration & Routing ---

  it('should call API with mapped data (including CUSTOMER role) and navigate on success', () => {
    const validForm = {
      valid: true,
      value: {
        name: 'Jane Doe',
        phone: '1234567890',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        companyName: 'Logistics Inc',
        gstNumber: '29ABCDE1234F1Z5',
        email: 'jane@example.com',
        shippingAddress: '123 Ship St',
        billingAddress: '456 Bill Ave'
      }
    } as NgForm;
    
    component.register(validForm);

    // 1. Ensure the loading state activated
    expect(component.submitting).toBeTruthy(); // Synchronous check (mock resolves instantly)

    // 2. Ensure API was called with exactly the right payload mapping
    expect(mockAuthService.register).toHaveBeenCalledWith({
      name: 'Jane Doe',
      phone: '1234567890',
      password: 'securePassword123',
      role: 'CUSTOMER', // CRITICAL: Ensure role is hardcoded
      companyName: 'Logistics Inc',
      gstNumber: '29ABCDE1234F1Z5',
      email: 'jane@example.com',
      shippingAddress: '123 Ship St',
      billingAddress: '456 Bill Ave'
    });

    // 3. Ensure router navigated to login
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 409 Conflict / 400 Bad Request errors specifically', () => {
    mockAuthService.register.mockReturnValue(throwError(() => ({ status: 409 })));
    
    const validForm = {
      valid: true,
      value: { password: 'pass', confirmPassword: 'pass' }
    } as NgForm;
    
    component.register(validForm);

    expect(component.errorMessage).toBe('That phone number is already registered, or a field is invalid.');
    expect(component.submitting).toBeFalsy();
  });

  it('should handle generic server errors safely', () => {
    mockAuthService.register.mockReturnValue(throwError(() => ({ status: 500 })));
    
    const validForm = {
      valid: true,
      value: { password: 'pass', confirmPassword: 'pass' }
    } as NgForm;
    
    component.register(validForm);

    expect(component.errorMessage).toBe('Registration failed. Please try again.');
    expect(component.submitting).toBeFalsy();
  });

  // --- 4. DOM & Template Tests ---

  it('should render the error message alert when errorMessage is populated', async () => {
    component.errorMessage = 'A critical error occurred.';
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('.alert-danger');
    
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('A critical error occurred.');
  });

  it('should update the submit button text and disable it when submitting', async () => {
    component.submitting = true;
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    expect(submitBtn.disabled).toBeTruthy();
    expect(submitBtn.textContent).toContain('Creating account…');
  });
});