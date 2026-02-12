Multi-Tenant User Management & Role Assignment
============================================

This document summarizes the implementation of multi-tenant user management features, including role assignment, store isolation, and module-level access control.

Implemented Features
--------------------

### 1. User Management Interface (`UsersPage.tsx`)
- **Enhanced Form**: Administrators can now create and edit users with granular control.
  - **Role Selection**: Assign roles (Super Admin, Admin, Manager, Cashier).
  - **Store Assignment**: 
    - **Super Admins**: Can assign users to any active store via a dropdown.
    - **Admins**: Automatically assign created users to their own store (selector hidden).
  - **Module Assignment**: New checkbox interface to explicitly grant access to specific system modules (Dashboard, POS, Inventory, etc.).

### 2. Permissions Enforcement
- **Backend & Data Layer**:
  - Updated `user_profiles` table schema to support `modules` (Text Array).
  - Updated `auth.store.ts` to fetch and store assigned `modules` upon login.
- **Frontend Access Control**:
  - **Sidebar Navigation**: `AppLayout.tsx` now dynamically filters menu items based on both the user's Role and their explicit Module assignments.
  - **Protected Routes**: `ProtectedModule.tsx` and `usePermissions.ts` hook updated to respect user-specific module grants.
  - **Logic**: Permissions are **additive**. A user has access if their Role allows it OR if they have been explicitly granted the module.

### 3. Store Isolation & Security
- **Edge Function (`create-user`)**:
  - Enforces that Admins can only create users for their own `store_id`.
  - Prevents Admins from creating `super_admin` accounts.
- **Row Level Security (RLS)**:
  - Applied migration `admin_role_policies` to allow Admins to view and manage users strictly within their own store.

### 4. Fixes & Improvements
- **Type Safety**: Resolved TypeScript errors regarding `ModuleName` types.
- **Linting**: Cleaned up unused imports in permission hooks.

How to Test
-----------
1. **As Super Admin**:
   - Go to **Admin > Usuarios**.
   - Create a new user. You should see "Tienda" selector and "Módulos" checkboxes.
   - Assign a specific store and specific modules (e.g., only "POS").
   - Login as that new user and verify sidebar only shows POS.

2. **As Admin**:
   - Go to **Admin > Usuarios**. 
   - Verify you CANNOT see the "Tienda" selector (it defaults to your store).
   - Verify you CANNOT select "Super Admin" role.
   - Create a user.
   - Verify the user is created in your store.

3. **Modules Check**:
   - Uncheck "Finanzas" for a Manager user.
   - Login as that Manager.
   - Verify "Finanzas" is hidden from the sidebar.

Next Steps
----------
- Improve RLS for `stores` table if access issues arise for Admins.
- Consider implementing "Deny" permissions if strict role restriction is needed beyond additive modules.
