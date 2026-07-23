import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsComponent } from './notifications'; // Ensure path matches your file
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

// Services
import { Notifications as NotificationsService } from '../../services/notifications';
import { Login } from '../../../../core/services/login';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;

  // 1. Vitest Service Mocks
  const mockLoginService = {
    getUserId: vi.fn()
  };

  const mockNotificationsService = {
    getForUser: vi.fn(),
    markAsRead: vi.fn()
  };

  // 2. Dummy Data (Mixed dates and statuses for filter testing)
  const mockNotifications = [
    { id: 1, message: 'Oldest Unread', read: false, createdAt: '2026-07-10T10:00:00Z' },
    { id: 2, message: 'Newest Read', read: true, createdAt: '2026-07-25T10:00:00Z' },
    { id: 3, message: 'Middle Unread', read: false, createdAt: '2026-07-15T10:00:00Z' }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Returns
    mockLoginService.getUserId.mockReturnValue(99);
    
    // Deep clone the array so tests don't mutate each other's data
    mockNotificationsService.getForUser.mockReturnValue(of(JSON.parse(JSON.stringify(mockNotifications))));
    mockNotificationsService.markAsRead.mockReturnValue(of({ read: true } as any));

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent, FormsModule],
      providers: [
        { provide: Login, useValue: mockLoginService },
        { provide: NotificationsService, useValue: mockNotificationsService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
  });

  // --- 1. Initialization & Data Fetching ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should abort init if userId is missing', () => {
    mockLoginService.getUserId.mockReturnValue(null);
    fixture.detectChanges();

    expect(mockNotificationsService.getForUser).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should fetch data, disable loading, and sort newest first on init', () => {
    fixture.detectChanges();

    expect(mockNotificationsService.getForUser).toHaveBeenCalledWith(99);
    expect(component.loading).toBe(false);
    
    // Verify default sort (Newest date first -> ID 2, then 3, then 1)
    expect(component.filtered.length).toBe(3);
    expect(component.filtered[0].id).toBe(2); 
    expect(component.filtered[1].id).toBe(3);
    expect(component.filtered[2].id).toBe(1);
  });

  it('should handle API errors safely during fetch', () => {
    mockNotificationsService.getForUser.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.notifications.length).toBe(0);
    expect(component.loading).toBe(false);
  });

  // --- 2. Filter & Date Logic ---

  it('should accurately count unread notifications', () => {
    fixture.detectChanges();
    expect(component.unreadCount()).toBe(2); // IDs 1 and 3 are unread
  });

  it('should filter by read/unread status', () => {
    fixture.detectChanges();

    component.setReadFilter('unread');
    expect(component.filtered.length).toBe(2);
    expect(component.filtered.every(n => n.read === false)).toBe(true);

    component.setReadFilter('read');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].id).toBe(2);
  });

  it('should filter by date range correctly', () => {
    fixture.detectChanges();

    // Filter to only include dates from July 12 to July 20
    component.fromDate = '2026-07-12';
    component.toDate = '2026-07-20';
    component.applyFilters();

    // Should only catch ID 3 (July 15)
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].id).toBe(3);
  });

  it('should clear dates and reset filter list', () => {
    fixture.detectChanges();

    component.fromDate = '2026-07-12';
    component.applyFilters();
    expect(component.filtered.length).toBe(2); // Drops ID 1

    component.clearDates();
    expect(component.fromDate).toBe('');
    expect(component.toDate).toBe('');
    expect(component.filtered.length).toBe(3); // Fully restored
  });

  // --- 3. Actions (Single and Batch Updates) ---

  it('should abort single markAsRead if already read', () => {
    fixture.detectChanges();
    const readItem = component.notifications.find(n => n.id === 2)!; // ID 2 is read
    
    component.markAsRead(readItem);
    
    expect(mockNotificationsService.markAsRead).not.toHaveBeenCalled();
  });

  it('should call API, update state, and re-filter on single markAsRead', () => {
    fixture.detectChanges();
    const unreadItem = component.notifications.find(n => n.id === 3)!;
    
    component.markAsRead(unreadItem);
    
    expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(3);
    expect(unreadItem.read).toBe(true);
  });

  it('should abort markAllAsRead if there are no unread items', () => {
    // Force all to be read
    mockNotificationsService.getForUser.mockReturnValue(of([{ id: 1, read: true, createdAt: '2026-07-10T10:00:00Z' } as any]));
    fixture.detectChanges();

    component.markAllAsRead();
    expect(mockNotificationsService.markAsRead).not.toHaveBeenCalled();
    expect(component.markingAll).toBe(false);
  });

  it('should loop through unread items and mark them read concurrently', () => {
    fixture.detectChanges(); // Initializes with 2 unread items (IDs 1 and 3)
    
    component.markAllAsRead();

    // The component sets markingAll to true, fires 2 APIs, and instantly resolves them via our of() mock
    expect(mockNotificationsService.markAsRead).toHaveBeenCalledTimes(2);
    expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(1);
    expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(3);
    
    expect(component.markingAll).toBe(false); // Resets to false after loop finishes
    expect(component.unreadCount()).toBe(0);
  });

  it('should properly decrement remaining counter and reset markingAll even if an API fails', () => {
    fixture.detectChanges();
    
    // Force the API to fail for all calls
    mockNotificationsService.markAsRead.mockReturnValue(throwError(() => new Error('Update failed')));
    
    component.markAllAsRead();

    expect(mockNotificationsService.markAsRead).toHaveBeenCalledTimes(2);
    // It should STILL unlock the UI even though errors occurred
    expect(component.markingAll).toBe(false); 
  });

  // --- 4. DOM & Template Output ---

  it('should show the loading spinner initially', () => {
    mockNotificationsService.getForUser.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show global empty state if no notifications exist from API', async () => {
    mockNotificationsService.getForUser.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("No notifications yet.");
  });

  it('should show filter empty state if notifications exist but none match filter', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.setReadFilter('read');
    component.fromDate = '2099-01-01'; // Impossible future date
    component.applyFilters();
    
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("No notifications match your current filter options.");
  });

  it('should render the list of notifications with unread styles applied correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.list-group-item');
    
    expect(items.length).toBe(3);
    
    // First item in the DOM should be ID 2 (Newest, Read)
    expect(items[0].textContent).toContain('Newest Read');
    expect(items[0].classList.contains('bg-body-tertiary')).toBe(false);
    expect(items[0].querySelector('.badge[title="Unread"]')).toBeNull();

    // Second item in the DOM should be ID 3 (Middle, Unread)
    expect(items[1].textContent).toContain('Middle Unread');
    expect(items[1].classList.contains('bg-body-tertiary')).toBe(true);
    expect(items[1].querySelector('.badge[title="Unread"]')).toBeTruthy();
  });
});