import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { hasModuleAccess } from '@/config/permissions'
import type { ModuleName } from '@/config/permissions'
import { Card } from '@/components/ui/card'
import { Shield } from 'lucide-react'

interface ProtectedModuleProps {
    module: ModuleName
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Component to protect routes based on module permissions
 * Usage:
 * <ProtectedModule module="finance">
 *   <FinancePage />
 * </ProtectedModule>
 */
export function ProtectedModule({ module, children, fallback }: ProtectedModuleProps) {
    const { role, loading } = useAuthStore()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-muted-foreground">Cargando...</div>
            </div>
        )
    }

    const hasAccess = hasModuleAccess(role, module)

    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>
        }

        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="p-8 max-w-md">
                    <div className="text-center">
                        <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                        <p className="text-muted-foreground mb-4">
                            No tienes permisos para acceder a este módulo.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Contacta a tu administrador si crees que esto es un error.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    return <>{children}</>
}
