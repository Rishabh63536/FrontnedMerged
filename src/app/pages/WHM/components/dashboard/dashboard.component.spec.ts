import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard'; 
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Warehouses } from '../../services/warehouses';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { ProductWarehouses } from '../../services/product-warehouses';
import { Notifications } from '../../services/notifications';
import { Login } from '../../../../core/services/login';

describe('Warehouse Manager DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  // 1. Vitest Service Mocks (Replaces jasmine.createSpyObj)
  const mockLoginService = {
    getStoredUser: vi.fn(),
    getWarehouseId: vi.fn(),
    getUserId: vi.fn()
  };

  const mockWarehousesService = { getById: vi.fn() };
  const mockOrdersService = { getAwaitingAssignment: vi.fn() };
  const mockReturnRequestsService = { getPending: vi.fn() };
  const mockProductWarehousesService = { getLowStockByWarehouse: vi.fn() };
  const mockNotificationsService = { getUnreadForUser: vi.fn() };

  // 2. Dummy Data
  const mockUser = { name: 'Sarah Manager' };
  const mockWarehouse = { warehouseCode: 'WH-ALPHA', location: 'New Delhi Hub' };
  
  const mockOrders = Array.from({ length: 6 }).map((_, i) => ({
    id: 100 + i,
    shippingAddress: `Address ${i}`,
    quantity: 10,
    placedAt: '2026-07-20T10:00:00Z'
  }));

  const mockLowStock = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    productId: 200 + i,
    productName: `Widget ${i}`,
    stock: 5,
    maxStock: 100,
    rolPercent: 20
  }));

  const mockReturns = [{}, {}]; 
  const mockNotifications = [{}, {}, {}]; 

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Returns
    mockLoginService.getStoredUser.mockReturnValue(mockUser);
    mockLoginService.getWarehouseId.mockReturnValue(88);
    mockLoginService.getUserId.mockReturnValue(99);

    mockWarehousesService.getById.mockReturnValue(of(mockWarehouse as any));
    mockOrdersService.getAwaitingAssignment.mockReturnValue(of(mockOrders as any));
    mockReturnRequestsService.getPending.mockReturnValue(of(mockReturns as any));
    mockProductWarehousesService.getLowStockByWarehouse.mockReturnValue(of(mockLowStock as any));
    mockNotificationsService.getUnreadForUser.mockReturnValue(of(mockNotifications as any));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: Warehouses, useValue: mockWarehousesService },
        { provide: Orders, useValue: mockOrdersService },
        { provide: ReturnRequests, useValue: mockReturnRequestsService },
        { provide: ProductWarehouses, useValue: mockProductWarehousesService },
        { provide: Notifications, useValue: mockNotificationsService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort initialization and show warning if manager has no assigned warehouse', async () => {
    mockLoginService.getWarehouseId.mockReturnValue(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockWarehousesService.getById).not.toHaveBeenCalled();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Your account isn't assigned to a warehouse yet");
    
    // Using Vitest's toBe(false) instead of Jasmine's toBeFalse()
    expect(component.loading).toBe(false); 
  });

  it('should fetch all dashboard data and compute counts/slices correctly on init', () => {
    fixture.detectChanges();

    expect(mockWarehousesService.getById).toHaveBeenCalledWith(88);
    expect(component.managerName).toBe('Sarah Manager');
    expect(component.awaitingAssignmentCount).toBe(6);
    expect(component.urgentOrders.length).toBe(5);
    expect(component.loading).toBe(false);
  });

  it('should safely handle API errors (e.g. warehouse fetch fails)', () => {
    mockWarehousesService.getById.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.warehouse).toBeNull();
  });

  it('should show the loading spinner initially', () => {
    mockWarehousesService.getById.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should render urgent orders table with up to 5 items', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('#100');
    expect(compiled.textContent).toContain('Address 0');
  });
});