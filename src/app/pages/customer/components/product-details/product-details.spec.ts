import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailsComponent } from './product-details';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Products } from '../../services/products';
import { Orders } from '../../services/orders';
import { Login } from '../../../../core/services/login';

describe('ProductDetailsComponent', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;
  let router: Router;

  // 1. Vitest Service Mocks
  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: vi.fn().mockReturnValue('101') // Mocks URL /products/101
      }
    }
  };

  const mockProductService = {
    getById: vi.fn()
  };

  const mockOrdersService = {
    placeOrder: vi.fn()
  };

  const mockLoginService = {
    getRoleProfileId: vi.fn()
  };

  // 2. Dummy Data
  const mockProduct = {
    productId: 101,
    productName: 'Bulk Cargo Steel',
    productDescription: 'High-tensile industrial steel beams.',
    productPrice: 1500,
    vendorCompanyName: 'Acme Logistics'
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockProductService.getById.mockReturnValue(of(mockProduct as any));
    mockLoginService.getRoleProfileId.mockReturnValue(42); // Customer ID
    mockOrdersService.placeOrder.mockReturnValue(of({ id: 999 } as any)); // Returns new Order ID

    await TestBed.configureTestingModule({
      imports: [ProductDetailsComponent, FormsModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Products, useValue: mockProductService },
        { provide: Orders, useValue: mockOrdersService },
        { provide: Login, useValue: mockLoginService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    
    // Inject the real router and spy on it
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  // --- 1. Initialization & Data Fetching ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch product details on init and disable loading', () => {
    fixture.detectChanges();

    expect(mockProductService.getById).toHaveBeenCalledWith(101);
    expect(component.product?.productName).toBe('Bulk Cargo Steel');
    expect(component.loading).toBeFalsy();
  });

  it('should handle API errors when fetching the product', () => {
    mockProductService.getById.mockReturnValue(throwError(() => new Error('Not Found')));
    
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Product not found.');
    expect(component.loading).toBeFalsy();
  });

  // --- 2. Computed Properties & Logic ---

  it('should calculate totalPrice based on quantity', () => {
    fixture.detectChanges(); // Loads product price: 1500

    component.quantity = 1;
    expect(component.totalPrice).toBe(1500);

    component.quantity = 5;
    expect(component.totalPrice).toBe(7500);
  });

  it('should return 0 for totalPrice if product is not loaded', () => {
    mockProductService.getById.mockReturnValue(throwError(() => new Error('Failed')));
    fixture.detectChanges();

    expect(component.totalPrice).toBe(0);
  });

  // --- 3. Order Placement Tests ---

  it('should abort order placement if form is invalid', () => {
    fixture.detectChanges();
    
    const invalidForm = { valid: false } as NgForm;
    component.placeOrder(invalidForm);

    expect(mockOrdersService.placeOrder).not.toHaveBeenCalled();
  });

  it('should abort order placement and show error if session expired (no customer ID)', () => {
    fixture.detectChanges();
    mockLoginService.getRoleProfileId.mockReturnValue(null); // Simulate logged out
    
    const validForm = { valid: true, value: { shippingAddress: '123 Test St' } } as NgForm;
    component.placeOrder(validForm);

    expect(mockOrdersService.placeOrder).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Session expired. Please log in again.');
  });

  it('should call placeOrder API and navigate on success', () => {
    fixture.detectChanges();
    component.quantity = 3;
    
    const validForm = { valid: true, value: { shippingAddress: '123 Test St' } } as NgForm;
    
    // Act
    component.placeOrder(validForm);

    // Assert API Payload
    expect(mockOrdersService.placeOrder).toHaveBeenCalledWith({
      customerId: 42,
      productId: 101,
      quantity: 3,
      shippingAddress: '123 Test St'
    });
    
    // Assert Navigation
    expect(router.navigate).toHaveBeenCalledWith(['/customer/orders', 999]);
  });

  it('should handle 409 Out of Stock error during placement', () => {
    fixture.detectChanges();
    
    // Mock the API to throw a 409 error
    mockOrdersService.placeOrder.mockReturnValue(throwError(() => ({ status: 409 })));
    
    const validForm = { valid: true, value: { shippingAddress: '123 Test St' } } as NgForm;
    component.placeOrder(validForm);

    expect(component.errorMessage).toBe('Not enough stock available for this quantity.');
    expect(component.placingOrder).toBeFalsy();
  });

  it('should handle generic errors during placement', () => {
    fixture.detectChanges();
    
    // Mock the API to throw a 500 error
    mockOrdersService.placeOrder.mockReturnValue(throwError(() => ({ status: 500 })));
    
    const validForm = { valid: true, value: { shippingAddress: '123 Test St' } } as NgForm;
    component.placeOrder(validForm);

    expect(component.errorMessage).toBe('Could not place order. Please try again.');
    expect(component.placingOrder).toBeFalsy();
  });

  // --- 4. DOM & Template Output ---

  it('should show the loading spinner initially', () => {
    // Stall the API with an empty subject
    mockProductService.getById.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
    expect(compiled.textContent).toContain('Constructing Inventory Blueprint Specification...');
  });

  it('should display product details correctly in the DOM', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Bulk Cargo Steel');
    expect(compiled.textContent).toContain('Acme Logistics');
    expect(compiled.textContent).toContain('High-tensile industrial steel beams.');
    expect(compiled.textContent).toContain('₹1500');
  });
});