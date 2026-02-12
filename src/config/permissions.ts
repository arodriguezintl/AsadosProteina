import type { UserRole } from '@/types/database.types'

export type ModuleName =
    | 'dashboard'
    | 'pos'
    | 'orders'
    | 'inventory'
    | 'recipes'
    | 'finance'
    | 'reports'
    | 'crm'
    | 'hr'
    | 'users'

export type Permission = 'view' | 'create' | 'edit' | 'delete'

// Define what modules each role can access
export const ROLE_PERMISSIONS: Record<UserRole, Record<ModuleName, Permission[]>> = {
    super_admin: {
        dashboard: ['view'],
        pos: ['view', 'create', 'edit', 'delete'],
        orders: ['view', 'create', 'edit', 'delete'],
        inventory: ['view', 'create', 'edit', 'delete'],
        recipes: ['view', 'create', 'edit', 'delete'],
        finance: ['view', 'create', 'edit', 'delete'],
        reports: ['view'],
        crm: ['view', 'create', 'edit', 'delete'],
        hr: ['view', 'create', 'edit', 'delete'],
        users: ['view', 'create', 'edit', 'delete'], // Only super_admin
    },
    admin: {
        dashboard: ['view'],
        pos: ['view', 'create', 'edit', 'delete'],
        orders: ['view', 'create', 'edit', 'delete'],
        inventory: ['view', 'create', 'edit', 'delete'],
        recipes: ['view', 'create', 'edit', 'delete'],
        finance: ['view', 'create', 'edit', 'delete'],
        reports: ['view'],
        crm: ['view', 'create', 'edit', 'delete'],
        hr: ['view', 'create', 'edit', 'delete'],
        users: [], // No access
    },
    manager: {
        dashboard: ['view'],
        pos: ['view', 'create', 'edit'],
        orders: ['view', 'create', 'edit'],
        inventory: ['view', 'create', 'edit'],
        recipes: ['view', 'create', 'edit'],
        finance: ['view'], // Read-only
        reports: ['view'],
        crm: ['view', 'create', 'edit'],
        hr: ['view'], // Read-only
        users: [], // No access
    },
    cashier: {
        dashboard: ['view'],
        pos: ['view', 'create'], // Can use POS
        orders: ['view'], // Can view orders
        inventory: ['view'], // Can check inventory
        recipes: ['view'], // Can view recipes
        finance: [], // No access
        reports: [], // No access
        crm: ['view'], // Can view customers
        hr: [], // No access
        users: [], // No access
    },
}

// Helper function to check if a role has access to a module
export function hasModuleAccess(role: UserRole | null, module: ModuleName): boolean {
    if (!role) return false
    const permissions = ROLE_PERMISSIONS[role]?.[module] || []
    return permissions.length > 0
}

// Helper function to check if a role has a specific permission on a module
export function hasPermission(
    role: UserRole | null,
    module: ModuleName,
    permission: Permission
): boolean {
    if (!role) return false
    const permissions = ROLE_PERMISSIONS[role]?.[module] || []
    return permissions.includes(permission)
}

// Get all accessible modules for a role
export function getAccessibleModules(role: UserRole | null): ModuleName[] {
    if (!role) return []
    const permissions = ROLE_PERMISSIONS[role]
    return Object.entries(permissions)
        .filter(([_, perms]) => perms.length > 0)
        .map(([module]) => module as ModuleName)
}
