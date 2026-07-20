import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PickupsComponent } from './pickups'; // Ensure this matches your file name
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { ReturnRequests } from '../../services/return-requests';
import { Login } from '../../../../core/services/login';

describe('PickupsComponent', () => {
  let component: PickupsComponent;
  let fixture: ComponentFixture<PickupsComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = {
    getRoleProfileId: vi.fn()
  };

  const mockReturnRequestsService = {
    getByDriver: vi.fn(),
    restock: vi.fn()
  };

  // 2. Dummy Data
  const mockReturns = [
    { id: 1, orderId: 101, status: 'APPROVED', reason: 'Defective', notes: 'Screen is cracked.' },
    { id: 2, orderId: 102, status: 'APPROVED', reason: 'Wrong Item' }, // No notes
    { id: 3, orderId: 103, status: 'PENDING', reason: 'Changed mind' } // Should be filtered out
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockLoginService.getRoleProfileId.mockReturnValue(55); // Driver ID
    mockReturnRequestsService.getByDriver.mockReturnValue(of(mockReturns as any));
    mockReturnRequestsService.restock.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [PickupsComponent],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: ReturnRequests, useValue: mockReturnRequestsService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PickupsComponent);
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
    expect(mockReturnRequestsService.getByDriver).not.toHaveBeenCalled();
  });

  it('should fetch returns and filter out anything not APPROVED', () => {
    fixture.detectChanges();

    expect(mockReturnRequestsService.getByDriver).toHaveBeenCalledWith(55);
    
    // Out of 3 mock returns, 1 is PENDING, so only 2 should remain
    expect(component.returns.length).toBe(2);
    expect(component.returns[0].id).toBe(1); 
    expect(component.returns[1].id).toBe(2);
    expect(component.loading).toBeFalsy();
  });

  it('should handle API errors safely during initialization', () => {
    mockReturnRequestsService.getByDriver.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(component.returns.length).toBe(0);
  });

  // --- 2. Action Logic (Photo & Restock) ---

  it('should extract the file from the HTML input event correctly', () => {
    const mockFile = new File([''], 'box.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      target: { files: [mockFile] }
    } as unknown as Event;

    component.onPhotoSelected(1, mockEvent);

    expect(component.selectedPhoto[1]).toBe(mockFile);
  });

  it('should call restock API WITH a photo if one is selected', () => {
    fixture.detectChanges();
    
    const mockFile = new File([''], 'box.jpg', { type: 'image/jpeg' });
    component.selectedPhoto[1] = mockFile;
    
    component.confirmRestock(1);

    expect(mockReturnRequestsService.restock).toHaveBeenCalledWith(1, mockFile);
    expect(component.successMessage).toBe('Return #1 restocked.');
    expect(component.restockingId).toBeNull();
  });

  it('should call restock API WITHOUT a photo (null) if none is selected', () => {
    fixture.detectChanges();
    
    // Ensure no photo is set
    component.selectedPhoto[2] = null;
    
    component.confirmRestock(2);

    expect(mockReturnRequestsService.restock).toHaveBeenCalledWith(2, null);
    expect(component.successMessage).toBe('Return #2 restocked.');
    expect(component.restockingId).toBeNull();
  });

  it('should extract specific backend error messages if restock fails', () => {
    fixture.detectChanges();
    
    const backendError = { error: { Message: 'Item already scanned.' } };
    mockReturnRequestsService.restock.mockReturnValue(throwError(() => backendError));
    
    component.confirmRestock(1);

    expect(component.errorMessage[1]).toBe('Item already scanned.');
    expect(component.restockingId).toBeNull();
  });

  it('should use fallback error message if restock fails without specific backend message', () => {
    fixture.detectChanges();
    
    mockReturnRequestsService.restock.mockReturnValue(throwError(() => new Error('Generic API Fail')));
    
    component.confirmRestock(1);

    expect(component.errorMessage[1]).toBe('Could not complete pickup.');
  });

  // --- 3. Timer Testing ---

  it('should automatically clear the success message after 4 seconds', async () => {
    vi.useFakeTimers(); // Hijack the clock
    fixture.detectChanges();
    
    component.confirmRestock(1);
    expect(component.successMessage).toBeTruthy();

    vi.advanceTimersByTime(4000); // Fast-forward 4 seconds
    
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.successMessage).toBeNull();

    vi.useRealTimers(); // Restore normal clock
  });

  // --- 4. DOM & Template Tests ---

  it('should display the loading spinner initially', () => {
    mockReturnRequestsService.getByDriver.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show empty state message if no approved returns are found', async () => {
    mockReturnRequestsService.getByDriver.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No pending pickups right now.');
  });

  it('should display return details correctly, including optional notes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check Item 1 (Has notes)
    expect(compiled.textContent).toContain('Return #1 — Order #101');
    expect(compiled.textContent).toContain('Reason: Defective');
    expect(compiled.textContent).toContain('"Screen is cracked."');

    // Check Item 2 (No notes)
    expect(compiled.textContent).toContain('Return #2 — Order #102');
    expect(compiled.textContent).not.toContain('""'); // Empty quotes shouldn't render
  });
});