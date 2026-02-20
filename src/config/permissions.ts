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
    | 'stores'
    | 'delivery'
    | 'payroll'

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
        users: ['view', 'create', 'edit', 'delete'],
        stores: ['view', 'create', 'edit', 'delete'],
        delivery: ['view', 'create', 'edit', 'delete'],
        payroll: ['view', 'create', 'edit', 'delete'],
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
        users: [], // No access to user management
        stores: ['view'], // Can view store details
        delivery: ['view', 'create', 'edit', 'delete'],
        payroll: ['view', 'create'],
    },
    manager: {
        dashboard: ['view'],
        pos: ['view', 'create', 'edit'],
        orders: ['view', 'create', 'edit'],
        inventory: ['view', 'create', 'edit'],
        recipes: ['view', 'create', 'edit'],
        finance: [], // REVOKED: Admin only
        reports: ['view'],
        crm: ['view', 'create', 'edit'],
        hr: ['view', 'create', 'edit'], // Managers usually manage staff
        users: [],
        stores: [], // REVOKED: Admin only
        delivery: ['view', 'create', 'edit'],
        payroll: [], // REVOKED: Admin only
    },
    cashier: {
        dashboard: ['view'],
        pos: ['view', 'create'],
        orders: ['view'],
        inventory: ['view'],
        recipes: ['view'],
        finance: [],
        reports: [],
        crm: ['view'],
        hr: [],
        users: [],
        stores: [],
        delivery: [],
        payroll: [],
    },
    cook: {
        dashboard: ['view'],
        pos: [],
        orders: ['view', 'edit'], // View orders to cook, mark as ready
        inventory: ['view'], // Check stock
        recipes: ['view'], // View recipes
        finance: [],
        reports: [],
        crm: [],
        hr: [],
        users: [],
        stores: [],
        delivery: [],
        payroll: [],
    },
    delivery: {
        dashboard: [],
        pos: [],
        orders: ['view', 'edit'], // View assigned orders, update status
        inventory: [],
        recipes: [],
        finance: [],
        reports: [],
        crm: ['view'], // View customer details for delivery
        delivery: ['view', 'edit'], // Delivery specific module
        hr: [],
        users: [],
        stores: [],
        payroll: [],
    },
    accountant: {
        dashboard: ['view'],
        pos: [],
        orders: ['view'],
        inventory: ['view'],
        recipes: ['view'],
        finance: ['view', 'create', 'edit', 'delete'], // Full finance access
        reports: ['view'],
        crm: [],
        hr: ['view'], // View payroll/employee costs
        users: [],
        stores: ['view'],
        delivery: [],
        payroll: ['view', 'create', 'edit'],
    },
}

// Helper function to check if a role has access to a module
export function hasModuleAccess(role: UserRole | null, module: ModuleName, userModules?: string[]): boolean {
    if (!role) return false

    const roleAccess = (ROLE_PERMISSIONS[role]?.[module] || []).length > 0
    const userAccess = userModules?.includes(module) || false

    return roleAccess || userAccess
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
export function getAccessibleModules(role: UserRole | null, userModules?: string[]): ModuleName[] {
    if (!role) return []

    // Get modules from Role
    const roleModules = Object.entries(ROLE_PERMISSIONS[role])
        .filter(([_, perms]) => perms.length > 0)
        .map(([module]) => module as ModuleName)

    if (!userModules || userModules.length === 0) return roleModules

    // Combine with explicit User Modules ensuring uniqueness
    const combined = new Set([...roleModules, ...userModules])
    return Array.from(combined) as ModuleName[]
}
