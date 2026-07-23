import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReturnsQueueComponent } from './returns-queue'; // Ensure path matches
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Warehouses } from '../../services/warehouses';
import { ReturnRequests } from '../../services/return-requests';
import { Drivers } from '../../services/drivers';
import { Login } from '../../../../core/services/login';

describe('ReturnsQueueComponent', () => {
  let component: ReturnsQueueComponent;
  let fixture: ComponentFixture<ReturnsQueueComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = {
    getRoleProfileId: vi.fn(),
    getWarehouseId: vi.fn()
  };

  const mockWarehousesService = { getById: vi.fn() };
  const mockReturnRequestsService = { getPending: vi.fn(), approve: vi.fn(), reject: vi.fn() };
  const mockDriversService = { getAvailableByLocation: vi.fn() };

  // 2. Dummy Data
  const mockWarehouse = { id: 88, location: 'Mumbai Hub' };
  
  const mockDrivers = [
    { id: 10, userName: 'John Driver', licenseNumber: 'MH-01' },
    { id: 20, userName: 'Jane Transporter', licenseNumber: 'MH-02' }
  ];

  const mockReturns = [
    { 
      id: 1, 
      orderId: 101, 
      returnQuantity: 5, 
      reason: 'Damaged', 
      notes: 'Broken box', 
      photoUrl: 'http://example.com/photo.jpg' 
    },
    { 
      id: 2, 
      orderId: 102, 
      returnQuantity: 2, 
      reason: 'Wrong item' 
      // No notes or photo for item 2
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockLoginService.getRoleProfileId.mockReturnValue(77); // Manager ID
    mockLoginService.getWarehouseId.mockReturnValue(88); // Warehouse ID

    mockWarehousesService.getById.mockReturnValue(of(mockWarehouse as any));
    mockDriversService.getAvailableByLocation.mockReturnValue(of([...mockDrivers] as any));
    mockReturnRequestsService.getPending.mockReturnValue(of([...mockReturns] as any));
    
    mockReturnRequestsService.approve.mockReturnValue(of({} as any));
    mockReturnRequestsService.reject.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [ReturnsQueueComponent, FormsModule],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: Warehouses, useValue: mockWarehousesService },
        { provide: ReturnRequests, useValue: mockReturnRequestsService },
        { provide: Drivers, useValue: mockDriversService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsQueueComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Data Fetching ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort init if managerId or warehouseId is missing', () => {
    mockLoginService.getRoleProfileId.mockReturnValue(null);
    fixture.detectChanges();

    expect(mockWarehousesService.getById).not.toHaveBeenCalled();
    expect(mockReturnRequestsService.getPending).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should fetch warehouse, matching drivers, and pending returns on init', () => {
    fixture.detectChanges();

    // Verify chained fetching
    expect(mockWarehousesService.getById).toHaveBeenCalledWith(88);
    expect(mockDriversService.getAvailableByLocation).toHaveBeenCalledWith('Mumbai Hub');
    expect(mockReturnRequestsService.getPending).toHaveBeenCalled();
    
    expect(component.availableDrivers.length).toBe(2);
    expect(component.returns.length).toBe(2);
    expect(component.loading).toBe(false);
  });

  it('should handle API errors safely during init', () => {
    mockReturnRequestsService.getPending.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.returns.length).toBe(0);
  });

  // --- 2. Action Logic (Reject) ---

  it('should reject return, show success message, reload, and clear message after 4s', async () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    component.reject(1);

    expect(mockReturnRequestsService.reject).toHaveBeenCalledWith(1, { managerId: 77 });
    expect(component.successMessage).toBe('Return #1 rejected.');
    expect(mockReturnRequestsService.getPending).toHaveBeenCalledTimes(2); // Init + reload

    // Fast-forward time
    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.successMessage).toBeNull();
    vi.useRealTimers();
  });

  it('should handle API errors gracefully during rejection', () => {
    fixture.detectChanges();
    
    mockReturnRequestsService.reject.mockReturnValue(throwError(() => new Error('Failed')));
    component.reject(1);

    expect(component.errorMessage).toBe('Could not reject this return.');
  });

  // --- 3. Action Logic (Approve & UI Toggles) ---

  it('should toggle the approve panel when openApprove is called', () => {
    component.openApprove(1);
    expect(component.actioningId).toBe(1);

    component.openApprove(1); // Clicking again closes it
    expect(component.actioningId).toBeNull();
  });

  it('should prevent approval if no driver is selected', () => {
    fixture.detectChanges();
    
    component.selectedDriverId[1] = null as any; // No driver selected
    component.confirmApprove(1);

    expect(component.errorMessage).toBe('Select a pickup driver first.');
    expect(mockReturnRequestsService.approve).not.toHaveBeenCalled();
  });

  it('should process approval, assign driver, remove driver from list, and handle timers', async () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    component.openApprove(1);
    component.selectedDriverId[1] = 10; // Select Driver John
    
    component.confirmApprove(1);

    expect(mockReturnRequestsService.approve).toHaveBeenCalledWith(1, { managerId: 77, driverId: 10 });
    expect(component.successMessage).toBe('Return #1 approved, pickup driver assigned.');
    expect(component.actioningId).toBeNull();
    
    // Ensure the driver was removed from the local available pool
    expect(component.availableDrivers.length).toBe(1);
    expect(component.availableDrivers[0].id).toBe(20); // Only Jane remains

    expect(mockReturnRequestsService.getPending).toHaveBeenCalledTimes(2); // Reload

    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.successMessage).toBeNull();
    vi.useRealTimers();
  });

  it('should handle API errors gracefully during approval', () => {
    fixture.detectChanges();
    
    component.selectedDriverId[1] = 10;
    mockReturnRequestsService.approve.mockReturnValue(throwError(() => new Error('Failed')));
    
    component.confirmApprove(1);

    expect(component.errorMessage).toBe('Could not approve — driver may no longer be available.');
  });

  // --- 4. DOM & Template Tests ---

  it('should show the loading spinner initially', () => {
    mockReturnRequestsService.getPending.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show empty state message if no pending returns exist', async () => {
    mockReturnRequestsService.getPending.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No pending returns right now. All caught up!');
  });

  it('should render the list of returns correctly including notes and photo link if present', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check Item 1 (Has notes and photo)
    expect(compiled.textContent).toContain('Return #1');
    expect(compiled.textContent).toContain('Order #101');
    expect(compiled.textContent).toContain('Reason:');
    expect(compiled.textContent).toContain('Damaged');
    expect(compiled.textContent).toContain('"Broken box"'); // Notes
    expect(compiled.querySelector('a[href="http://example.com/photo.jpg"]')).toBeTruthy();

    // Check Item 2 (No notes or photo)
    expect(compiled.textContent).toContain('Return #2');
    expect(compiled.textContent).toContain('Wrong item');
    expect(compiled.textContent).not.toContain('""'); // Empty quotes shouldn't render
  });

  it('should render the inline approve panel when Approve is clicked via DOM', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Find the first "Approve" button and click it to open the panel
    const approveBtn = compiled.querySelector('button.btn-primary') as HTMLButtonElement;
    approveBtn.click();

    // Let Angular process the view update safely without NG0100
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify the dropdown panel opened
    expect(compiled.textContent).toContain('Select pickup driver…');
    expect(compiled.textContent).toContain('John Driver'); 
    expect(compiled.textContent).toContain('Jane Transporter'); 
    expect(compiled.textContent).toContain('Confirm Approval'); 
  });
});