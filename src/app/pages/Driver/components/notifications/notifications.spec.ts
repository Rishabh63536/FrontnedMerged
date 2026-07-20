import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsComponent } from './notifications'; // Ensure path is correct
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

  // 2. Dummy Data
  const mockNotifications = [
    { id: 1, message: 'New order assigned to you.', read: false, createdAt: '2026-07-20T10:00:00Z' },
    { id: 2, message: 'System maintenance tonight.', read: true, createdAt: '2026-07-19T15:00:00Z' }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // 3. Setup Default Happy-Path Returns
    mockLoginService.getUserId.mockReturnValue(99);
    mockNotificationsService.getForUser.mockReturnValue(of(mockNotifications as any));
    mockNotificationsService.markAsRead.mockReturnValue(of({ read: true } as any));

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
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

  it('should abort initialization if userId is missing', () => {
    mockLoginService.getUserId.mockReturnValue(null);
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(mockNotificationsService.getForUser).not.toHaveBeenCalled();
  });

  it('should fetch notifications on init and disable loading', () => {
    fixture.detectChanges();

    expect(mockLoginService.getUserId).toHaveBeenCalled();
    expect(mockNotificationsService.getForUser).toHaveBeenCalledWith(99);
    
    expect(component.notifications.length).toBe(2);
    expect(component.loading).toBeFalsy();
  });

  it('should handle API errors safely during initialization', () => {
    mockNotificationsService.getForUser.mockReturnValue(throwError(() => new Error('API down')));
    fixture.detectChanges();

    expect(component.loading).toBeFalsy();
    expect(component.notifications.length).toBe(0);
  });

  // --- 2. Action Logic (markAsRead) ---

  it('should abort markAsRead if the notification is already read', () => {
    fixture.detectChanges();
    const readNotification = component.notifications[1]; // read: true
    
    component.markAsRead(readNotification);

    expect(mockNotificationsService.markAsRead).not.toHaveBeenCalled();
  });

  it('should call API and update local state when marking an unread notification as read', () => {
    fixture.detectChanges();
    
    // Deep copy to prevent test bleed
    const unreadNotification = { ...component.notifications[0] }; // read: false
    
    component.markAsRead(unreadNotification);

    expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(1);
    expect(unreadNotification.read).toBeTruthy(); // Validates the state update from the mock response
  });

  it('should fail gracefully if markAsRead API fails', () => {
    fixture.detectChanges();
    const unreadNotification = { ...component.notifications[0] }; // read: false
    
    // Force the API to fail
    mockNotificationsService.markAsRead.mockReturnValue(throwError(() => new Error('Failed to update')));
    
    component.markAsRead(unreadNotification);

    // API was called, but local state remains false because the success block didn't run
    expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(1);
    expect(unreadNotification.read).toBeFalsy(); 
  });

  // --- 3. DOM & Template Tests ---

  it('should show the loading spinner initially', () => {
    mockNotificationsService.getForUser.mockReturnValue(new Subject());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-border')).toBeTruthy();
  });

  it('should show an empty state message if there are no notifications', async () => {
    mockNotificationsService.getForUser.mockReturnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No notifications yet.');
  });

  it('should render the list of notifications with correct styling for unread items', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.list-group-item');
    
    expect(items.length).toBe(2);
    
    // Unread item checks
    expect(items[0].classList.contains('bg-teal-tint')).toBeTruthy();
    expect(items[0].textContent).toContain('New order assigned to you.');
    expect(items[0].querySelector('.badge')?.textContent).toContain('New');

    // Read item checks
    expect(items[1].classList.contains('bg-teal-tint')).toBeFalsy();
    expect(items[1].textContent).toContain('System maintenance tonight.');
    expect(items[1].querySelector('.badge')).toBeNull(); // No 'New' badge
  });

  it('should trigger markAsRead when a notification is clicked', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // Spy directly on the component method to ensure the HTML click binding works
    const markAsReadSpy = vi.spyOn(component, 'markAsRead');

    const compiled = fixture.nativeElement as HTMLElement;
    const firstItem = compiled.querySelector('.list-group-item') as HTMLElement;
    
    // Click the HTML element
    firstItem.click();
    
    // Let Angular process the click
    fixture.detectChanges();

    expect(markAsReadSpy).toHaveBeenCalledWith(component.notifications[0]);
  });
});