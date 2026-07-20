import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyOrdersComponent } from './my-orders';
import { Router, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Orders } from '../../services/orders';
import { Login } from '../../../../core/services/login';

describe('MyOrdersComponent', () => {
  let component: MyOrdersComponent;
  let fixture: ComponentFixture<MyOrdersComponent>;
  let router: Router; // We will inject the real router and spy on it

  // 1. Vitest Service Mocks
  const mockOrdersService = {
    getActiveByCustomer: vi.fn(),
    getPastByCustomer: vi.fn()
  };

  const mockLoginService = {
    getRoleProfileId: vi.fn()
  };

  // 2. Dummy Data
  const mockActiveOrders = [
    { id: 101, productNameSnapshot: 'Steel Beams', quantity: 50, placedAt: '2026-07-20T10:00:00Z', totalAmount: 15000, status: 'DISPATCHED' }
  ];

  const mockPastOrders = [
    { id: 102, productNameSnapshot: 'Copper Wire', quantity: 200, placedAt: '2026-07-10T10:00:00Z', totalAmount: 8000, status: 'DELIVERED' }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Returns
    mockLoginService.getRoleProfileId.mockReturnValue(999);
    mockOrdersService.getActiveByCustomer.mockReturnValue(of(mockActiveOrders as any));
    mockOrdersService.getPastByCustomer.mockReturnValue(of(mockPastOrders as any));

    await TestBed.configureTestingModule({
      imports: [MyOrdersComponent], 
      providers: [
        provideRouter([]), // Gives Angular real routing capabilities so it doesn't crash on routerLink
        { provide: Orders, useValue: mockOrdersService },
        { provide: Login, useValue: mockLoginService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyOrdersComponent);
    component = fixture.componentInstance;
    
    // Inject the real router and spy on its navigate function
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  // --- 1. Initialization & Logic Tests ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch active and past orders on init and disable loading', () => {
    fixture.detectChanges();

    expect(mockOrdersService.getActiveByCustomer).toHaveBeenCalledWith(999);
    expect(mockOrdersService.getPastByCustomer).toHaveBeenCalledWith(999);
    expect(component.activeOrders.length).toBe(1);
    expect(component.pastOrders.length).toBe(1);
    expect(component.loading).toBeFalsy();
  });

  it('should abort init if customerId is not found', () => {
    mockLoginService.getRoleProfileId.mockReturnValue(null);
    
    fixture.detectChanges();

    expect(mockOrdersService.getActiveByCustomer).not.toHaveBeenCalled();
    expect(mockOrdersService.getPastByCustomer).not.toHaveBeenCalled();
  });

  it('should return the correct array from displayedOrders based on activeTab', () => {
    fixture.detectChanges();

    expect(component.activeTab).toBe('active');
    expect(component.displayedOrders).toEqual(component.activeOrders);

    component.activeTab = 'past';
    expect(component.displayedOrders).toEqual(component.pastOrders);
  });

  it('should generate the correct status badge CSS class', () => {
    expect(component.statusBadgeClass('DELIVERED')).toBe('badge-status-delivered');
    expect(component.statusBadgeClass('IN_TRANSIT')).toBe('badge-status-in_transit');
  });

  // --- 2. User Interaction Tests ---

  it('should navigate to the correct order detail page when a card is clicked', () => {
    component.viewOrder(101);
    expect(router.navigate).toHaveBeenCalledWith(['/customer/orders', 101]);
  });

  it('should switch tabs and update data when tab buttons are clicked', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const pastTabBtn = compiled.querySelectorAll('button')[1];

    pastTabBtn.click();
    
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeTab).toBe('past');
    expect(compiled.textContent).toContain('Copper Wire');
  });

  // --- 3. DOM & Template State Tests ---

  it('should show the loading spinner when loading is true', () => {
    // We use an empty Subject to mimic an API call that hasn't finished yet.
    // This forces component.loading to stay "true" so we can test the UI without NG0100 errors.
    const pendingRequest = new Subject();
    mockOrdersService.getActiveByCustomer.mockReturnValue(pendingRequest);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
    expect(compiled.textContent).toContain('Retrieving Manifest Records...');
  });

  it('should show empty active state when active orders list is empty', async () => {
    mockOrdersService.getActiveByCustomer.mockReturnValue(of([]));
    
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No active freight distributions right now');
    expect(compiled.textContent).toContain('Browse Product Inventory');
  });

  it('should show empty past state when past orders list is empty', async () => {
    mockOrdersService.getPastByCustomer.mockReturnValue(of([]));
    
    // Set the tab state BEFORE the first render cycle to avoid ExpressionChanged errors
    component.activeTab = 'past';
    
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No archived order histories available');
  });

  it('should render the order card data correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.card');
    
    expect(cards.length).toBe(1);
    expect(compiled.textContent).toContain('#101');
    expect(compiled.textContent).toContain('Steel Beams');
    expect(compiled.textContent).toContain('50 Units');
    expect(compiled.textContent).toContain('₹15000');
    expect(compiled.textContent).toContain('DISPATCHED');
  });
});