import { MyOrdersComponent } from './my-orders';
import { Router, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { Login } from '../../../../core/services/login';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('MyOrdersComponent', () => {
  let component: MyOrdersComponent;
  let fixture: ComponentFixture<MyOrdersComponent>;
  let router: Router;

  const mockOrdersService = {
    getActiveByCustomer: vi.fn(),
    getPastByCustomer: vi.fn(),
  };

  const mockReturnRequestsService = {
    getByCustomer: vi.fn(),
  };

  const mockLoginService = {
    getRoleProfileId: vi.fn(),
  };

  const mockActiveOrders = [
    { id: 101, productNameSnapshot: 'Steel Beams', quantity: 50, placedAt: '2026-07-20T10:00:00Z', totalAmount: 15000, status: 'IN_TRANSIT' }
  ];

  const mockPastOrders = [
    { id: 102, productNameSnapshot: 'Copper Wire', quantity: 200, placedAt: '2026-07-10T10:00:00Z', totalAmount: 8000, status: 'DELIVERED' },
    { id: 103, productNameSnapshot: 'Cement Bags', quantity: 100, placedAt: '2026-07-05T10:00:00Z', totalAmount: 5000, status: 'DELIVERED' }
  ];

  const mockReturns = [
    { id: 1, orderId: 103, status: 'RESTOCKED', returnQuantity: 100 }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    mockLoginService.getRoleProfileId.mockReturnValue(999);
    mockOrdersService.getActiveByCustomer.mockReturnValue(of(mockActiveOrders as any));
    mockOrdersService.getPastByCustomer.mockReturnValue(of(mockPastOrders as any));
    mockReturnRequestsService.getByCustomer.mockReturnValue(of(mockReturns as any));

    await TestBed.configureTestingModule({
      imports: [MyOrdersComponent],
      providers: [
        provideRouter([]),
        { provide: Orders, useValue: mockOrdersService },
        { provide: ReturnRequests, useValue: mockReturnRequestsService },
        { provide: Login, useValue: mockLoginService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyOrdersComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should cross-reference return status onto past orders', () => {
    fixture.detectChanges();

    expect(component.pastOrders.length).toBe(2);
    // Order #103 should have 'RESTOCKED' status merged from returns list
    const order103 = component.pastOrders.find((o) => o.id === 103);
    expect(order103?.status).toBe('RESTOCKED');
  });

  it('should map ReturnStatus.RESTOCKED to RETURNED for UI display', () => {
    expect(component.getStatusDisplay('RESTOCKED')).toBe('RETURNED');
    expect(component.getStatusDisplay('REQUESTED')).toBe('RETURN REQUESTED');
    expect(component.getStatusDisplay('DELIVERED')).toBe('DELIVERED');
  });

  it('should filter past orders by RETURNED status', () => {
    fixture.detectChanges();

    component.setActiveTab('past');
    component.onStatusChange('RETURNED');

    expect(component.currentTabOrders.length).toBe(1);
    expect(component.currentTabOrders[0].id).toBe(103);
  });
});