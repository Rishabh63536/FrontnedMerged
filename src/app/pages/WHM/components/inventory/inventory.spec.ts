import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryComponent } from './inventory'; // Ensure path is correct
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { ProductWarehouses } from '../../services/product-warehouses';
import { Login } from '../../../../core/services/login';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = {
    getWarehouseId: vi.fn()
  };

  const mockPwService = {
    getByWarehouseId: vi.fn(),
    restock: vi.fn()
  };

  // 2. Dummy Data
  const mockItems = [
    { 
      id: 1, 
      productName: 'Steel Beams', 
      vendorCompanyName: 'Acme Corp', 
      stock: 80, 
      maxStock: 100, 
      rolPercent: 20, 
      belowRol: false 
    },
    { 
      id: 2, 
      productName: 'Copper Wire', 
      vendorCompanyName: 'Global Tech', 
      stock: 10, 
      maxStock: 100, 
      rolPercent: 20, 
      belowRol: true // 10 is below 20% of 100
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Returns
    mockLoginService.getWarehouseId.mockReturnValue(88);
    mockPwService.getByWarehouseId.mockReturnValue(of(mockItems as any));
    mockPwService.restock.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [InventoryComponent, FormsModule],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: ProductWarehouses, useValue: mockPwService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Data Fetching ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort init if warehouseId is not found', () => {
    mockLoginService.getWarehouseId.mockReturnValue(null);
    fixture.detectChanges();

    expect(mockPwService.getByWarehouseId).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should fetch inventory items on init and disable loading', () => {
    fixture.detectChanges();

    expect(mockPwService.getByWarehouseId).toHaveBeenCalledWith(88);
    expect(component.items.length).toBe(2);
    expect(component.loading).toBe(false);
  });

  it('should safely handle API errors during fetch', () => {
    mockPwService.getByWarehouseId.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.items.length).toBe(0);
    expect(component.loading).toBe(false);
  });

  // --- 2. Helper Logic ---

  it('should calculate stock percentage correctly', () => {
    const item1 = { stock: 50, maxStock: 100 } as any;
    const item2 = { stock: 75, maxStock: 300 } as any;
    
    expect(component.getStockPercentage(item1)).toBe(50);
    expect(component.getStockPercentage(item2)).toBe(25); // 75/300
  });

  it('should return 0 for stock percentage if maxStock is invalid or 0', () => {
    const item1 = { stock: 50, maxStock: 0 } as any;
    const item2 = { stock: 50, maxStock: null } as any;
    
    expect(component.getStockPercentage(item1)).toBe(0);
    expect(component.getStockPercentage(item2)).toBe(0);
  });

  // --- 3. UI Toggles & Validation ---

  it('should toggle the inline restock form and initialize the amount', () => {
    fixture.detectChanges();
    const item = component.items[0]; // stock is 80

    // Open it
    component.openRestock(item);
    expect(component.restockingId).toBe(1);
    expect(component.restockAmount[1]).toBe(80);

    // Close it (toggle)
    component.openRestock(item);
    expect(component.restockingId).toBeNull();
  });

  it('should prevent restock API call if input amount is invalid', () => {
    fixture.detectChanges();
    
    // Set invalid amounts
    component.restockAmount[1] = -5;
    component.confirmRestock(1);
    expect(component.errorMessage).toBe('Enter a valid stock amount.');
    expect(mockPwService.restock).not.toHaveBeenCalled();

    component.restockAmount[1] = null as any;
    component.confirmRestock(1);
    expect(component.errorMessage).toBe('Enter a valid stock amount.');
    expect(mockPwService.restock).not.toHaveBeenCalled();
  });

  // --- 4. Restock API Integration & Timers ---

  it('should call restock API, reload data, and clear success message after 4s', async () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    component.restockingId = 1;
    component.restockAmount[1] = 95;
    
    component.confirmRestock(1);

    expect(mockPwService.restock).toHaveBeenCalledWith(1, { amount: 95 });
    expect(component.successMessage).toBe('Stock updated.');
    expect(component.restockingId).toBeNull();
    expect(mockPwService.getByWarehouseId).toHaveBeenCalledTimes(2); // Initial load + Reload

    // Fast-forward time
    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.successMessage).toBeNull();

    vi.useRealTimers();
  });

  it('should extract specific 400 error message (exceeding capacity)', () => {
    fixture.detectChanges();
    
    component.restockAmount[1] = 500; // Will trigger backend error
    mockPwService.restock.mockReturnValue(throwError(() => ({ status: 400 })));
    
    component.confirmRestock(1);

    expect(component.errorMessage).toBe('That would exceed max stock capacity.');
  });

  it('should use generic error message for non-400 errors', () => {
    fixture.detectChanges();
    
    component.restockAmount[1] = 95;
    mockPwService.restock.mockReturnValue(throwError(() => ({ status: 500 })));
    
    component.confirmRestock(1);

    expect(component.errorMessage).toBe('Could not restock.');
  });

  // --- 5. DOM & Template Tests ---

  it('should show the loading spinner initially', () => {
    mockPwService.getByWarehouseId.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show empty state message if no products exist', async () => {
    mockPwService.getByWarehouseId.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No products launched at your warehouse yet.');
  });

  it('should render standard items normally and ROL items with warning classes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody > tr'); // Excluding inline edit rows for now
    
    // Row 0: Normal
    expect(rows[0].textContent).toContain('Steel Beams');
    expect(rows[0].classList.contains('table-warning-subtle')).toBe(false);
    expect(rows[0].querySelector('.badge.bg-danger')).toBeNull();

    // Row 1: Low Stock (below ROL)
    expect(rows[1].textContent).toContain('Copper Wire');
    expect(rows[1].classList.contains('table-warning-subtle')).toBe(true);
    expect(rows[1].querySelector('.badge.bg-danger')?.textContent).toContain('Low');
  });

  it('should render the inline edit row when openRestock is triggered', async () => {
    // 1. Initial render
    fixture.detectChanges();
    await fixture.whenStable();

    // 2. Find the "Update Stock" button in the HTML and click it directly.
    // This perfectly simulates real user behavior and prevents NG0100 entirely.
    const compiled = fixture.nativeElement as HTMLElement;
    const updateBtn = compiled.querySelector('button.btn-outline-primary') as HTMLButtonElement;
    updateBtn.click();

    // 3. Immediately tell Angular to check the view
    fixture.detectChanges();
    await fixture.whenStable();

    // 4. Assert the inline edit row successfully appeared
    expect(compiled.textContent).toContain('New Count');
    expect(compiled.textContent).toContain('Save Configuration');
  });
});