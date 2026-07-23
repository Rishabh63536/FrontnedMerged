import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersQueueComponent } from './orders-queue'; // Ensure path matches
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Warehouses } from '../../services/warehouses';
import { Orders } from '../../services/orders';
import { Drivers } from '../../services/drivers';
import { Login } from '../../../../core/services/login';

describe('OrdersQueueComponent', () => {
  let component: OrdersQueueComponent;
  let fixture: ComponentFixture<OrdersQueueComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = { getWarehouseId: vi.fn() };
  const mockWarehousesService = { getById: vi.fn() };
  const mockOrdersService = { getAwaitingAssignment: vi.fn(), assignDriver: vi.fn() };
  const mockDriversService = { getAvailableByLocation: vi.fn() };

  // 2. Dummy Data
  const mockWarehouse = { id: 88, location: 'Chennai Hub' };
  
  const mockDrivers = [
    { id: 10, userName: 'Alice Driver', licenseNumber: 'TN-01' },
    { id: 20, userName: 'Bob Transporter', licenseNumber: 'TN-02' }
  ];

  // Generate 6 orders to test pagination (pageSize is 5)
  const mockOrders = Array.from({ length: 6 }).map((_, i) => ({
    id: 100 + i, // 100, 101, 102...
    productNameSnapshot: i === 0 ? 'Unique Steel Beams' : `Product ${i}`,
    customerName: i === 1 ? 'Acme Corp' : `Customer ${i}`,
    shippingAddress: `Address ${i}`,
    quantity: 10,
    totalAmount: 5000
  }));

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockLoginService.getWarehouseId.mockReturnValue(88);
    mockWarehousesService.getById.mockReturnValue(of(mockWarehouse as any));
    mockDriversService.getAvailableByLocation.mockReturnValue(of([...mockDrivers] as any));
    mockOrdersService.getAwaitingAssignment.mockReturnValue(of([...mockOrders] as any));
    mockOrdersService.assignDriver.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [OrdersQueueComponent, FormsModule],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: Warehouses, useValue: mockWarehousesService },
        { provide: Orders, useValue: mockOrdersService },
        { provide: Drivers, useValue: mockDriversService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersQueueComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Data Fetching ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort init if warehouseId is missing', () => {
    mockLoginService.getWarehouseId.mockReturnValue(null);
    fixture.detectChanges();

    expect(mockWarehousesService.getById).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should fetch warehouse, matching drivers, and orders on init', () => {
    fixture.detectChanges();

    expect(mockWarehousesService.getById).toHaveBeenCalledWith(88);
    expect(mockDriversService.getAvailableByLocation).toHaveBeenCalledWith('Chennai Hub');
    expect(mockOrdersService.getAwaitingAssignment).toHaveBeenCalledWith(88);
    
    expect(component.availableDrivers.length).toBe(2);
    expect(component.orders.length).toBe(6);
    expect(component.loading).toBe(false);
  });

  it('should handle API errors safely during init', () => {
    mockOrdersService.getAwaitingAssignment.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.orders.length).toBe(0);
  });

  // --- 2. Search & Pagination Logic ---

  it('should slice data into pages correctly', () => {
    fixture.detectChanges(); // Loads 6 orders

    expect(component.totalPages).toBe(2);
    expect(component.pagedOrders.length).toBe(5); // Page 1 has 5 items
    
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.pagedOrders.length).toBe(1); // Page 2 has 1 item
  });

  it('should filter by search term and reset to page 1', () => {
    fixture.detectChanges();
    component.goToPage(2); // Move to page 2

    // Search for a specific product name
    component.searchTerm = 'Unique Steel';
    component.onSearchChange();

    expect(component.currentPage).toBe(1); // Resets to 1
    expect(component.filteredOrders.length).toBe(1);
    expect(component.pagedOrders[0].id).toBe(100);
  });

  it('should filter by order ID or customer name', () => {
    fixture.detectChanges();

    component.searchTerm = '101'; // ID search
    component.onSearchChange();
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].id).toBe(101);

    component.searchTerm = 'Acme Corp'; // Customer search
    component.onSearchChange();
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].id).toBe(101);
  });

  // --- 3. Assignment UI & API Logic ---

  it('should toggle the assignment panel', () => {
    component.openAssign(100);
    expect(component.assigningOrderId).toBe(100);

    component.openAssign(100); // Clicking again closes it
    expect(component.assigningOrderId).toBeNull();
  });

  it('should prevent assignment if no driver is selected', () => {
    fixture.detectChanges();
    
    component.selectedDriverId[100] = null as any; // No driver
    component.confirmAssign(100);

    expect(component.errorMessage).toBe('Select a driver first.');
    expect(mockOrdersService.assignDriver).not.toHaveBeenCalled();
  });

  it('should process assignment, remove driver from list, and handle timers', async () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    component.openAssign(100);
    component.selectedDriverId[100] = 10; // Select Driver A
    
    component.confirmAssign(100);

    expect(mockOrdersService.assignDriver).toHaveBeenCalledWith(100, { driverId: 10 });
    expect(component.successMessage).toBe('Driver assigned to order #100.');
    expect(component.assigningOrderId).toBeNull();
    
    // Ensure the driver was removed from the local available pool
    expect(component.availableDrivers.length).toBe(1);
    expect(component.availableDrivers[0].id).toBe(20); // Only Driver B remains

    // Ensure it reloaded the orders queue
    expect(mockOrdersService.getAwaitingAssignment).toHaveBeenCalledTimes(2);

    // Fast-forward 4 seconds
    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.successMessage).toBeNull();

    vi.useRealTimers();
  });

  it('should extract specific 400 error message if driver is taken', () => {
    fixture.detectChanges();
    
    component.selectedDriverId[100] = 10;
    mockOrdersService.assignDriver.mockReturnValue(throwError(() => ({ status: 400 })));
    
    component.confirmAssign(100);

    expect(component.errorMessage).toBe('That driver is no longer available. Pick another.');
  });

  it('should fallback to generic error message for other errors', () => {
    fixture.detectChanges();
    
    component.selectedDriverId[100] = 10;
    mockOrdersService.assignDriver.mockReturnValue(throwError(() => ({ status: 500 })));
    
    component.confirmAssign(100);

    expect(component.errorMessage).toBe('Could not assign driver.');
  });

  // --- 4. DOM & Template Tests ---

  it('should show the loading spinner initially', () => {
    mockOrdersService.getAwaitingAssignment.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show global empty state if no orders exist', async () => {
    mockOrdersService.getAwaitingAssignment.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No orders currently awaiting driver assignment. All caught up!');
  });

  it('should show search empty state if search yields no results', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.searchTerm = 'ImpossibleSearchString123';
    component.onSearchChange();
    
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No orders match "ImpossibleSearchString123"');
  });

  it('should render the list of orders correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Order #100');
    expect(compiled.textContent).toContain('Unique Steel Beams');
    expect(compiled.textContent).toContain('Qty: 10');
  });

  it('should render the assignment panel when the button is clicked via the DOM', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Find the first "Assign Driver" button and click it to open the panel safely
    const assignBtn = compiled.querySelector('button.btn-primary') as HTMLButtonElement;
    assignBtn.click();

    // Let Angular process the view update
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify the panel opened
    expect(compiled.textContent).toContain('Select an available driver…');
    expect(compiled.textContent).toContain('Alice Driver'); // Option 1
    expect(compiled.textContent).toContain('Bob Transporter'); // Option 2
  });
});