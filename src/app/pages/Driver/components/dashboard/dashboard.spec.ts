import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Drivers } from '../../services/drivers';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { Notifications } from '../../services/notifications';
import { Login } from '../../../../core/services/login';

describe('Driver DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = {
    getRoleProfileId: vi.fn(),
    getUserId: vi.fn()
  };

  const mockDriversService = {
    getById: vi.fn(),
    updateAvailability: vi.fn()
  };

  const mockOrdersService = {
    getByDriver: vi.fn()
  };

  const mockReturnRequestsService = {
    getByDriver: vi.fn()
  };

  const mockNotificationsService = {
    getUnreadForUser: vi.fn()
  };

  // 2. Dummy Data for Filtering Logic
  const mockDriver = {
    id: 10,
    userName: 'Alex Driver',
    licenseNumber: 'DL-998877',
    city: 'Mumbai',
    available: true
  };

  const mockOrders = [
    { id: 1, status: 'ASSIGNED' }, // Should be counted
    { id: 2, status: 'IN_TRANSIT' }, // Should be counted
    { id: 3, status: 'DELIVERED' } // Should NOT be counted
  ];

  const mockReturns = [
    { id: 1, status: 'APPROVED' }, // Should be counted
    { id: 2, status: 'PENDING' } // Should NOT be counted
  ];

  const mockNotifications = [{}, {}, {}]; // 3 unread notifications

  beforeEach(async () => {
    // CRITICAL: Prevent spy memory leaks between tests
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockLoginService.getRoleProfileId.mockReturnValue(10);
    mockLoginService.getUserId.mockReturnValue(99);
    
    mockDriversService.getById.mockReturnValue(of(mockDriver as any));
    mockDriversService.updateAvailability.mockReturnValue(of({ ...mockDriver, available: false } as any));
    
    mockOrdersService.getByDriver.mockReturnValue(of(mockOrders as any));
    mockReturnRequestsService.getByDriver.mockReturnValue(of(mockReturns as any));
    mockNotificationsService.getUnreadForUser.mockReturnValue(of(mockNotifications as any));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: Drivers, useValue: mockDriversService },
        { provide: Orders, useValue: mockOrdersService },
        { provide: ReturnRequests, useValue: mockReturnRequestsService },
        { provide: Notifications, useValue: mockNotificationsService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Filtering Logic ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort initialization if roleProfileId is missing', () => {
    mockLoginService.getRoleProfileId.mockReturnValue(null);
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(mockDriversService.getById).not.toHaveBeenCalled();
    expect(mockOrdersService.getByDriver).not.toHaveBeenCalled();
  });

  it('should fetch driver data and accurately filter dashboard metrics on init', () => {
    fixture.detectChanges();

    // Verify all APIs were called with correct IDs
    expect(mockDriversService.getById).toHaveBeenCalledWith(10);
    expect(mockOrdersService.getByDriver).toHaveBeenCalledWith(10);
    expect(mockReturnRequestsService.getByDriver).toHaveBeenCalledWith(10);
    expect(mockNotificationsService.getUnreadForUser).toHaveBeenCalledWith(99);

    // Verify Filtering Logic (Should only count ASSIGNED/IN_TRANSIT)
    expect(component.activeDeliveriesCount).toBe(2); 
    
    // Verify Filtering Logic (Should only count APPROVED)
    expect(component.pendingPickupsCount).toBe(1);
    
    // Verify pure counts
    expect(component.unreadNotificationsCount).toBe(3);
    
    expect(component.loading).toBeFalsy();
    expect(component.driver?.userName).toBe('Alex Driver');
  });

  it('should safely handle errors when fetching driver profile', () => {
    mockDriversService.getById.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(component.driver).toBeNull();
  });

  // --- 2. Action Tests (Toggle Availability) ---

  it('should toggle availability and update driver state on success', () => {
    fixture.detectChanges(); // Init load (Available: true)

    component.toggleAvailability();

    // Verify API called with flipped state (false)
    expect(component.togglingAvailability).toBeFalsy(); // Resets instantly due to mock
    expect(mockDriversService.updateAvailability).toHaveBeenCalledWith(10, { available: false });
    
    // Verify component state updated to match API response
    expect(component.driver?.available).toBeFalsy();
  });

  it('should handle API errors gracefully when toggling availability', () => {
    fixture.detectChanges();
    
    // Force the update to fail
    mockDriversService.updateAvailability.mockReturnValue(throwError(() => new Error('Update Failed')));
    
    component.toggleAvailability();

    // Ensure it resets the loading flag so the button isn't stuck forever
    expect(component.togglingAvailability).toBeFalsy();
  });

  it('should abort toggle attempt if driver object is null', () => {
    component.driver = null; // Ensure driver is null
    component.toggleAvailability();

    expect(mockDriversService.updateAvailability).not.toHaveBeenCalled();
  });

  // --- 3. DOM & Template Tests ---

  it('should show the loading spinner when loading is true', () => {
    // Stall the primary API with an empty subject
    mockDriversService.getById.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show an error alert if driver profile cannot be loaded', async () => {
    mockDriversService.getById.mockReturnValue(throwError(() => new Error('Not found')));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Could not load your driver profile.');
  });

  it('should render the driver welcome header correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Welcome, Alex Driver');
    expect(compiled.textContent).toContain('DL-998877');
    expect(compiled.textContent).toContain('Based in Mumbai');
  });

  it('should display the correct toggle button text based on availability', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('button') as HTMLButtonElement;
    
    // Initially true
    expect(toggleBtn.textContent).toContain('Available — tap to go offline');

    // Simulate toggle API success returning false
    mockDriversService.updateAvailability.mockReturnValue(of({ ...mockDriver, available: false } as any));
    toggleBtn.click();
    
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify UI updated
    expect(toggleBtn.textContent).toContain('Offline — tap to go available');
  });

  it('should render the dashboard metrics cards correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.card');
    
    expect(cards.length).toBe(3);
    expect(compiled.textContent).toContain('Active Deliveries');
    expect(compiled.textContent).toContain('2'); // From filter logic
    
    expect(compiled.textContent).toContain('Pending Pickups');
    expect(compiled.textContent).toContain('1'); // From filter logic
  });
});