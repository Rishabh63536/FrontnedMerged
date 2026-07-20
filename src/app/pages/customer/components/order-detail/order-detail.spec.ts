import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderDetailComponent } from './order-detail';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Orders } from '../../services/orders';
import { Payments } from '../../services/payments';
import { Invoices } from '../../services/invoices';

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;

  // 1. Vitest Service Mocks
  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: vi.fn().mockReturnValue('123') // Mocks URL /orders/123
      }
    }
  };

  const mockOrdersService = {
    getById: vi.fn()
  };

  const mockPaymentsService = {
    getByOrder: vi.fn(),
    payAdvance: vi.fn(),
    payFinal: vi.fn()
  };

  const mockInvoicesService = {
    getByOrder: vi.fn()
  };

  // 2. Dummy Data
  const mockOrderPending = {
    id: 123,
    status: 'PENDING',
    productNameSnapshot: 'Industrial Steel',
    quantity: 100,
    shippingAddress: 'Chennai, TN',
    grandTotal: 10000,
    orderAmountPaid: 0,
    placedAt: '2026-07-20T10:00:00Z'
  };

  const mockOrderInTransit = {
    ...mockOrderPending,
    status: 'IN_TRANSIT',
    orderAmountPaid: 5000, // 50% paid
    driverName: 'John Doe'
  };

  const mockPaymentsList = [
    { id: 1, type: 'ADVANCE', amount: 5000, paidAt: '2026-07-20T10:30:00Z' }
  ];

  const mockInvoice = {
    invoiceNumber: 'INV-999',
    subtotal: 9000,
    taxPercent: 10,
    taxAmount: 900,
    totalAmount: 10000
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Returns (Happy Path: Pending Order)
    mockOrdersService.getById.mockReturnValue(of(mockOrderPending as any));
    mockPaymentsService.getByOrder.mockReturnValue(of([] as any));
    mockPaymentsService.payAdvance.mockReturnValue(of({} as any));
    mockPaymentsService.payFinal.mockReturnValue(of({} as any));
    mockInvoicesService.getByOrder.mockReturnValue(of(mockInvoice as any));

    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Orders, useValue: mockOrdersService },
        { provide: Payments, useValue: mockPaymentsService },
        { provide: Invoices, useValue: mockInvoicesService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Data Fetching ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch order details and payments on init, but NOT invoice if PENDING', () => {
    fixture.detectChanges();

    expect(mockOrdersService.getById).toHaveBeenCalledWith(123);
    expect(mockPaymentsService.getByOrder).toHaveBeenCalledWith(123);
    expect(mockInvoicesService.getByOrder).not.toHaveBeenCalled(); // Skipped for PENDING
    
    expect(component.order?.id).toBe(123);
    expect(component.loading).toBeFalsy();
  });

  it('should fetch the invoice if the order status is past PENDING', () => {
    mockOrdersService.getById.mockReturnValue(of(mockOrderInTransit as any));
    
    fixture.detectChanges();

    expect(mockInvoicesService.getByOrder).toHaveBeenCalledWith(123);
    expect(component.invoice?.invoiceNumber).toBe('INV-999');
  });

  it('should handle API errors when fetching the order', () => {
    mockOrdersService.getById.mockReturnValue(throwError(() => new Error('Not Found')));
    
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Order not found.');
    expect(component.loading).toBeFalsy();
  });

  // --- 2. Computed Properties & Getters ---

  it('should generate the correct statusBadgeClass', () => {
    fixture.detectChanges(); // order is PENDING
    expect(component.statusBadgeClass).toBe('badge-status-pending');
  });

  it('should calculate amountPaid from order property if present', () => {
    mockOrdersService.getById.mockReturnValue(of(mockOrderInTransit as any)); // orderAmountPaid is 5000
    fixture.detectChanges();

    expect(component.amountPaid).toBe(5000);
  });

  it('should fallback to summing payments array if orderAmountPaid is undefined', () => {
    const orderWithoutAmountPaid = { ...mockOrderPending, orderAmountPaid: undefined };
    mockOrdersService.getById.mockReturnValue(of(orderWithoutAmountPaid as any));
    mockPaymentsService.getByOrder.mockReturnValue(of(mockPaymentsList as any)); // 1 payment of 5000
    
    fixture.detectChanges();

    expect(component.amountPaid).toBe(5000);
  });

  // --- 3. User Interactions (Payments) ---

 it('should process advance payment and reload order data', () => {
    fixture.detectChanges();
    
    component.payAdvance();

    // 1. Verify the API was called with the correct Order ID
    expect(mockPaymentsService.payAdvance).toHaveBeenCalledWith(123);
    
    // 2. Verify it reloaded the order (1st time was on init, 2nd time is after payment)
    expect(mockOrdersService.getById).toHaveBeenCalledTimes(2);

    // 3. Because the mock API resolves instantly, processingPayment should already be reset to false!
    expect(component.processingPayment).toBeFalsy(); 
  });

  it('should handle advance payment failure gracefully', () => {
    fixture.detectChanges();
    mockPaymentsService.payAdvance.mockReturnValue(throwError(() => new Error('Payment Failed')));
    
    component.payAdvance();

    expect(component.errorMessage).toBe('Payment failed. Please try again.');
    expect(component.processingPayment).toBeFalsy();
  });

  it('should process final payment and reload order data', () => {
    mockOrdersService.getById.mockReturnValue(of(mockOrderInTransit as any));
    fixture.detectChanges();
    
    component.payFinal();

    expect(mockPaymentsService.payFinal).toHaveBeenCalledWith(123);
    expect(mockOrdersService.getById).toHaveBeenCalledTimes(2);
  });

  // --- 4. DOM & Template Output ---

  it('should show the loading spinner initially', () => {
    // Stall the API so loading stays true
    mockOrdersService.getById.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
    expect(compiled.textContent).toContain('Fetching Manifest Specifications...');
  });

  it('should display the order information correctly in the header and body', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Header
    expect(compiled.textContent).toContain('Order Reference #123');
    expect(compiled.textContent).toContain('PENDING');
    
    // Body details
    expect(compiled.textContent).toContain('Industrial Steel');
    expect(compiled.textContent).toContain('100 Units');
    expect(compiled.textContent).toContain('Chennai, TN');
  });

  it('should show the Advance Payment button for PENDING orders', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    
    expect(button?.textContent).toContain('Authorize 50% Advance Booking Escrow');
  });

  it('should show the Final Payment button for IN_TRANSIT orders with pending balance', async () => {
    mockOrdersService.getById.mockReturnValue(of(mockOrderInTransit as any));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    
    expect(button?.textContent).toContain('Clear Remaining Freight Invoice Settlement');
  });

  it('should render the invoice section when an invoice is present', async () => {
    mockOrdersService.getById.mockReturnValue(of(mockOrderInTransit as any));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Itemized Commercial Invoice');
    expect(compiled.textContent).toContain('INV-999');
    expect(compiled.textContent).toContain('₹9000'); // Subtotal
  });

  it('should render the payments ledger when payments exist', async () => {
    mockOrdersService.getById.mockReturnValue(of(mockOrderInTransit as any));
    mockPaymentsService.getByOrder.mockReturnValue(of(mockPaymentsList as any));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Remittance Ledger History');
    expect(compiled.textContent).toContain('Initial Milestone Deposit');
    expect(compiled.textContent).toContain('+ ₹5000');
  });
});