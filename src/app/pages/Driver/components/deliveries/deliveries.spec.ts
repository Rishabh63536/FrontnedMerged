import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveriesComponent } from './deliveries'; // Ensure path is correct
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Orders } from '../../services/orders';
import { Login } from '../../../../core/services/login';

describe('DeliveriesComponent', () => {
  let component: DeliveriesComponent;
  let fixture: ComponentFixture<DeliveriesComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = {
    getRoleProfileId: vi.fn()
  };

  const mockOrdersService = {
    getByDriver: vi.fn(),
    startDelivery: vi.fn(),
    completeDelivery: vi.fn()
  };

  // 2. Dummy Data
  const mockOrders = [
    { id: 101, productNameSnapshot: 'Laptop', quantity: 1, customerName: 'Alice', shippingAddress: '123 Main St', status: 'ASSIGNED' },
    { id: 102, productNameSnapshot: 'Monitor', quantity: 2, customerName: 'Bob', shippingAddress: '456 Oak Ave', status: 'IN_TRANSIT' },
    { id: 103, productNameSnapshot: 'Keyboard', quantity: 5, customerName: 'Charlie', shippingAddress: '789 Pine Rd', status: 'DELIVERED' } // Should be filtered out
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockLoginService.getRoleProfileId.mockReturnValue(77); // Driver ID
    mockOrdersService.getByDriver.mockReturnValue(of(mockOrders as any));
    mockOrdersService.startDelivery.mockReturnValue(of({} as any));
    mockOrdersService.completeDelivery.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [DeliveriesComponent],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: Orders, useValue: mockOrdersService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveriesComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Filtering ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort initialization if roleProfileId is missing', () => {
    mockLoginService.getRoleProfileId.mockReturnValue(null);
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(mockOrdersService.getByDriver).not.toHaveBeenCalled();
  });

  it('should fetch orders and filter out anything not ASSIGNED or IN_TRANSIT', () => {
    fixture.detectChanges();

    expect(mockOrdersService.getByDriver).toHaveBeenCalledWith(77);
    
    // Out of 3 mock orders, 1 is DELIVERED, so only 2 should remain
    expect(component.orders.length).toBe(2);
    expect(component.orders[0].id).toBe(101); // ASSIGNED
    expect(component.orders[1].id).toBe(102); // IN_TRANSIT
    expect(component.loading).toBeFalsy();
  });

  it('should handle API errors safely during initialization', () => {
    mockOrdersService.getByDriver.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(component.orders.length).toBe(0);
  });

  // --- 2. Starting Delivery ---

  it('should start delivery successfully, set success message, and reload', () => {
    fixture.detectChanges();
    
    component.startDelivery(101);

    expect(mockOrdersService.startDelivery).toHaveBeenCalledWith(101);
    expect(component.successMessage).toBe('Order #101 is now in transit.');
    expect(component.startingId).toBeNull();
    // getByDriver should be called twice (1 for init, 1 for reload)
    expect(mockOrdersService.getByDriver).toHaveBeenCalledTimes(2); 
  });

  it('should handle start delivery errors correctly', () => {
    fixture.detectChanges();
    mockOrdersService.startDelivery.mockReturnValue(throwError(() => new Error('Failed')));
    
    component.startDelivery(101);

    expect(component.errorMessage[101]).toBe('Could not start delivery.');
    expect(component.startingId).toBeNull();
  });

  // --- 3. Completing Delivery (File Upload Logic) ---

  it('should prevent completion if no photo is selected', () => {
    fixture.detectChanges();
    
    // Ensure no photo is set for order 102
    component.selectedPhoto[102] = null;
    
    component.completeDelivery(102);

    expect(mockOrdersService.completeDelivery).not.toHaveBeenCalled();
    expect(component.errorMessage[102]).toBe('A delivery photo is required.');
  });

  it('should extract the file from the HTML input event correctly', () => {
    const mockFile = new File([''], 'proof.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      target: { files: [mockFile] }
    } as unknown as Event;

    component.onPhotoSelected(102, mockEvent);

    expect(component.selectedPhoto[102]).toBe(mockFile);
  });

  it('should complete delivery successfully if photo exists', () => {
    fixture.detectChanges();
    
    // Manually inject a mock file
    const mockFile = new File([''], 'proof.jpg', { type: 'image/jpeg' });
    component.selectedPhoto[102] = mockFile;
    
    component.completeDelivery(102);

    expect(mockOrdersService.completeDelivery).toHaveBeenCalledWith(102, mockFile);
    expect(component.successMessage).toBe('Order #102 marked as delivered.');
    expect(component.completingId).toBeNull();
    expect(component.errorMessage[102]).toBeNull();
    expect(mockOrdersService.getByDriver).toHaveBeenCalledTimes(2); // Verify reload
  });

  it('should extract specific backend error messages if completion fails', () => {
    fixture.detectChanges();
    
    const mockFile = new File([''], 'proof.jpg', { type: 'image/jpeg' });
    component.selectedPhoto[102] = mockFile;
    
    // Mock the specific backend error shape
    const backendError = { error: { Message: 'Final payment not yet received.' } };
    mockOrdersService.completeDelivery.mockReturnValue(throwError(() => backendError));
    
    component.completeDelivery(102);

    expect(component.errorMessage[102]).toBe('Final payment not yet received.');
    expect(component.completingId).toBeNull();
  });

  it('should use fallback error message if completion fails without specific backend message', () => {
    fixture.detectChanges();
    
    const mockFile = new File([''], 'proof.jpg', { type: 'image/jpeg' });
    component.selectedPhoto[102] = mockFile;
    
    mockOrdersService.completeDelivery.mockReturnValue(throwError(() => new Error('Generic API Fail')));
    
    component.completeDelivery(102);

    expect(component.errorMessage[102]).toBe('Could not complete delivery.');
  });

  // --- 4. Timer Testing ---

  it('should automatically clear the success message after 4 seconds', async () => {
    // 1. Tell Vitest to hijack the browser's internal clock
    vi.useFakeTimers(); 

    fixture.detectChanges();
    
    // Trigger the success message
    component.startDelivery(101);
    expect(component.successMessage).toBeTruthy();

    // 2. Fast-forward the hijacked clock by 4000 milliseconds
    vi.advanceTimersByTime(4000); 
    
    // Let Angular process the UI changes after the timer fires
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.successMessage).toBeNull();

    // 3. Restore the real clock so other tests aren't affected
    vi.useRealTimers(); 
  });

  // --- 5. DOM & Template Tests ---

  it('should display the loading spinner initially', () => {
    mockOrdersService.getByDriver.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show empty state message if no active orders are found', async () => {
    mockOrdersService.getByDriver.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No active deliveries right now.');
  });

  it('should display ASSIGNED orders with a "Start Delivery" button', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    // Order 101 is ASSIGNED
    expect(compiled.textContent).toContain('Order #101');
    expect(compiled.textContent).toContain('Start Delivery');
  });

  it('should display IN_TRANSIT orders with a file input and "Complete Delivery" button', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    // Order 102 is IN_TRANSIT
    expect(compiled.textContent).toContain('Order #102');
    expect(compiled.querySelector('input[type="file"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Complete Delivery');
  });
});