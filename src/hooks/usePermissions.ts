import { useAuthStore } from '@/store/auth.store'
import { hasModuleAccess, hasPermission, getAccessibleModules } from '@/config/permissions'
import type { ModuleName, Permission } from '@/config/permissions'

/**
 * Hook to check user permissions
 * Usage:
 * const { canView, canCreate, canEdit, canDelete, hasAccess } = usePermissions('inventory')
 */
export function usePermissions(module: ModuleName) {
    const { role } = useAuthStore()

    return {
        // Check if user can access this module at all
        hasAccess: hasModuleAccess(role, module),

        // Check specific permissions
        canView: hasPermission(role, module, 'view'),
        canCreate: hasPermission(role, module, 'create'),
        canEdit: hasPermission(role, module, 'edit'),
        canDelete: hasPermission(role, module, 'delete'),

        // Get all accessible modules for current user
        accessibleModules: getAccessibleModules(role),

        // Current user role
        userRole: role,
    }
}
