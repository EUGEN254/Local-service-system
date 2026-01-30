# Admin Project Structure Documentation

## Overview
The admin panel has been restructured to follow a modern, scalable architecture similar to the client application. This structure separates concerns into services, hooks, utilities, components, and pages.

## Directory Structure

```
admin/src/
├── assets/                    # Static assets (images, icons)
├── components/                # Reusable UI components
│   ├── Navbar.jsx            # Top navigation bar
│   └── Sidebar.jsx           # Side navigation
├── context/                   # React Context (AuthContext, etc.)
├── pages/                     # Page components
├── services/                  # API service layer
│   ├── adminAuthService.js         # Authentication
│   ├── adminUserService.js         # User management
│   ├── adminProviderService.js     # Service provider management
│   ├── adminBookingService.js      # Booking management
│   ├── adminCategoryService.js     # Category management
│   ├── adminNotificationService.js # Notification management
│   └── index.js              # Service exports
├── hooks/                     # Custom React hooks
│   ├── useAdminUsers.js       # User management hook
│   ├── useAdminProviders.js   # Provider management hook
│   ├── useAdminBookings.js    # Booking management hook
│   ├── useAdminCategories.js  # Category management hook
│   ├── useAdminNotifications.js # Notification hook
│   └── index.js              # Hook exports
├── utils/                     # Utility functions
│   ├── formatDateHelper.js    # Date formatting
│   ├── formatPhoneHelper.js   # Phone number formatting
│   ├── statusHelper.js        # Status badge styling
│   ├── commonHelpers.js       # Common utilities
│   └── index.js              # Utility exports
├── App.jsx                    # Main app component
└── main.jsx                   # Entry point
```

## Services Layer

### Purpose
Centralized API communication layer. All backend calls go through services.

### Available Services

#### `adminAuthService.js`
Authentication-related API calls
- `loginAdmin(email, password)` - Admin login
- `logoutAdmin()` - Admin logout
- `getCurrentAdmin()` - Fetch current admin data
- `verifyAdmin()` - Verify admin token

#### `adminUserService.js`
User/Customer management
- `fetchCustomers()` - Get all customers
- `fetchAdmins()` - Get all admins
- `updateUserStatus(userId, status)` - Update user status
- `updateUser(userId, formData)` - Update user profile
- `createUser(formData)` - Create new user
- `deleteUser(userId)` - Delete user

#### `adminProviderService.js`
Service provider management
- `fetchServiceProviders()` - Get all providers
- `updateVerificationStatus(providerId, isVerified)` - Verify provider
- `updateProviderProfile(providerId, formData)` - Update provider
- `createProvider(formData)` - Create provider
- `deleteProvider(providerId)` - Delete provider

#### `adminBookingService.js`
Booking and transaction management
- `fetchAllBookings()` - Get all bookings
- `fetchBookings(filters)` - Get filtered bookings
- `updateBookingStatus(bookingId, status)` - Update booking status
- `fetchTransactions(filters)` - Get transactions
- `fetchBookingStats()` - Get booking statistics

#### `adminCategoryService.js`
Service category management
- `fetchCategories()` - Get all categories
- `createCategory(formData)` - Create category
- `updateCategory(categoryId, formData)` - Update category
- `deleteCategory(categoryId)` - Delete category
- `toggleCategoryStatus(categoryId, isActive)` - Toggle category status

#### `adminNotificationService.js`
Notification management
- `fetchNotifications(filters)` - Get notifications
- `fetchUnreadCount()` - Get unread count
- `markNotificationAsRead(notificationId)` - Mark as read
- `markAllNotificationsAsRead()` - Mark all as read

## Custom Hooks

### Purpose
Encapsulate state management logic for specific features.

### Available Hooks

#### `useAdminUsers()`
Manages user state and operations
```javascript
const {
  customers,
  admins,
  loadingUsers,
  fetchCustomers,
  updateUserStatus,
  // ... other methods
} = useAdminUsers();
```

#### `useAdminProviders()`
Manages service provider state and operations
```javascript
const {
  serviceProviders,
  loadingProviders,
  fetchServiceProviders,
  updateVerificationStatus,
  // ... other methods
} = useAdminProviders();
```

#### `useAdminBookings()`
Manages booking state and operations
```javascript
const {
  allBookings,
  transactions,
  loadingAllBookings,
  fetchAllBookings,
  updateBookingStatus,
  // ... other methods
} = useAdminBookings();
```

#### `useAdminCategories()`
Manages category state and operations
```javascript
const {
  categories,
  loadingCategories,
  fetchCategories,
  createCategory,
  // ... other methods
} = useAdminCategories();
```

#### `useAdminNotifications()`
Manages notification state and operations
```javascript
const {
  notifications,
  unreadCount,
  fetchNotifications,
  markNotificationAsRead,
  // ... other methods
} = useAdminNotifications();
```

## Utilities

### Purpose
Reusable helper functions for formatting, validation, and common operations.

### Available Utilities

#### Date Formatting (`formatDateHelper.js`)
- `formatDate(dateString)` - Format to "Jan 30, 2026"
- `formatDateTime(dateString)` - Format with time
- `formatTime(dateString)` - Time only
- `getRelativeTime(dateString)` - "2h ago", "just now", etc.

#### Phone Formatting (`formatPhoneHelper.js`)
- `formatPhoneNumber(phone)` - Format to standard format
- `isValidPhoneNumber(phone)` - Validate phone
- `displayPhoneNumber(phone)` - Display formatted "+254 7xx xxx xxx"

#### Status Helpers (`statusHelper.js`)
- `getStatusColor(status)` - Get Tailwind color classes
- `getStatusBadgeClass(status)` - Get badge styling
- `capitalizeStatus(status)` - Format status text

#### Common Helpers (`commonHelpers.js`)
- `truncateText(text, length)` - Truncate with ellipsis
- `getInitials(name)` - Get name initials
- `formatCurrency(amount, currency)` - Format currency
- `calculatePercentage(value, total)` - Calculate percentage
- `generateId()` - Generate unique ID
- `sortByDate(items, field, order)` - Sort by date
- `filterByStatus(items, status, field)` - Filter by status
- `searchInArray(items, query, fields)` - Search functionality

## Usage Examples

### Using Services Directly
```javascript
import * as adminUserService from "../services/adminUserService";

const customers = await adminUserService.fetchCustomers();
```

### Using Hooks (Recommended)
```javascript
import { useAdminUsers } from "../hooks";

function Dashboard() {
  const { customers, fetchCustomers, updateUser } = useAdminUsers();

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    // Component JSX
  );
}
```

### Using Utilities
```javascript
import { formatDate, formatCurrency, getStatusBadgeClass } from "../utils";

const dateStr = formatDate(booking.createdAt); // "Jan 30, 2026"
const price = formatCurrency(100); // "KSh 100"
const badge = getStatusBadgeClass("completed"); // Tailwind classes
```

## Best Practices

1. **Always use hooks in components** - Don't call services directly unless necessary
2. **Keep components focused** - Use hooks to manage state
3. **Use utilities for formatting** - Don't format in JSX
4. **Error handling** - Hooks handle errors internally
5. **Loading states** - Hooks provide loading state variables
6. **Data validation** - Services validate responses

## Migration Guide

### From Old AdminContext to New Hooks
Old way:
```javascript
const { customers, fetchCustomers } = useContext(AdminContext);
```

New way:
```javascript
const { customers, fetchCustomers } = useAdminUsers();
```

### From Direct API Calls to Services
Old way:
```javascript
axios.get(`${backendUrl}/api/admin/customers`)
```

New way:
```javascript
import { adminUserService } from "../services";
const data = await adminUserService.fetchCustomers();
```

## File Size & Performance

- **Services**: ~2-3 KB each
- **Hooks**: ~3-4 KB each
- **Utils**: ~1-2 KB each
- **Total new structure**: ~40 KB (minified: ~12 KB)

## Future Enhancements

1. Add caching layer in services
2. Add request throttling/debouncing
3. Add offline support
4. Add error logging
5. Add analytics tracking
