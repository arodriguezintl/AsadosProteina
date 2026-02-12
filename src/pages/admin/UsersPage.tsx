import { useEffect, useState } from 'react'
import { UserService } from '@/services/user.service'
import type { UserProfile, UserRole } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Search, Shield, UserCog, Mail, Key, UserX, UserCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [stores, setStores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'cashier' as UserRole,
        store_id: '',
        modules: [] as string[]
    })
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    const { role: currentUserRole, storeId: currentStoreId } = useAuthStore()

    const AVAILABLE_MODULES: { id: string, label: string }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'pos', label: 'Punto de Venta' },
        { id: 'inventory', label: 'Inventario' },
        { id: 'recipes', label: 'Recetas' },
        { id: 'crm', label: 'Clientes (CRM)' },
        { id: 'hr', label: 'Recursos Humanos' },
        { id: 'finance', label: 'Finanzas' },
        { id: 'reports', label: 'Reportes' },
        { id: 'admin', label: 'Administración' },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [usersData, storesData] = await Promise.all([
                UserService.getUsers(),
                UserService.getStores()
            ])
            setUsers(usersData)
            setStores(storesData || [])
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadUsers = async () => {
        try {
            const data = await UserService.getUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error loading users:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Determine store_id: if super_admin uses form value, if admin uses their own store
            const finalStoreId = currentUserRole === 'super_admin' ? formData.store_id : currentStoreId

            if (selectedUser) {
                // Update existing user
                await UserService.updateUser(selectedUser.id, {
                    full_name: formData.full_name,
                    role: formData.role,
                    store_id: finalStoreId || null,
                    modules: formData.modules as any,
                    is_active: formData.role !== 'super_admin' ? true : selectedUser.is_active // Prevent deactivating super admin by mistake? No, logical keep as is.
                })
            } else {
                // Create new user
                await UserService.createUser({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    role: formData.role,
                    store_id: finalStoreId,
                    modules: formData.modules as any
                })
            }

            setIsDialogOpen(false)
            setSelectedUser(null)
            resetForm()
            loadUsers()
        } catch (error: any) {
            const errorMessage = error?.message || 'Error al guardar usuario'
            alert(errorMessage)
            console.error('User creation error:', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            role: 'cashier',
            store_id: currentUserRole === 'admin' ? (currentStoreId || '') : '', // Pre-fill for admin?
            modules: []
        })
    }

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
        }

        if (passwordData.newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        try {
            if (selectedUser) {
                await UserService.resetPassword(selectedUser.id, passwordData.newPassword)
                alert('Contraseña actualizada exitosamente')
                setIsPasswordDialogOpen(false)
                setPasswordData({ newPassword: '', confirmPassword: '' })
            }
        } catch (error: any) {
            alert(error?.message || 'Error al cambiar contraseña')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (user: UserProfile) => {
        try {
            if (user.is_active) {
                await UserService.deactivateUser(user.id)
            } else {
                await UserService.activateUser(user.id)
            }
            loadUsers()
        } catch (error: any) {
            alert(error?.message || 'Error al cambiar estado del usuario')
        }
    }

    const openEditUser = (user: UserProfile) => {
        setSelectedUser(user)
        setFormData({
            email: user.email,
            password: '',
            full_name: user.full_name,
            role: user.role,
            store_id: user.store_id || '',
            modules: user.modules || []
        })
        setIsDialogOpen(true)
    }

    const openCreateUser = () => {
        setSelectedUser(null)
        resetForm()
        setIsDialogOpen(true)
    }

    const openPasswordDialog = (user: UserProfile) => {
        setSelectedUser(user)
        setPasswordData({ newPassword: '', confirmPassword: '' })
        setIsPasswordDialogOpen(true)
    }

    const toggleModule = (moduleId: string) => {
        setFormData(prev => {
            const modules = prev.modules || []
            if (modules.includes(moduleId)) {
                return { ...prev, modules: modules.filter(m => m !== moduleId) }
            } else {
                return { ...prev, modules: [...modules, moduleId] }
            }
        })
    }

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRoleBadge = (role: UserRole) => {
        const variants: Record<UserRole, { color: string, label: string }> = {
            super_admin: { color: 'bg-red-500', label: 'Super Admin' },
            admin: { color: 'bg-purple-500', label: 'Administrador' },
            manager: { color: 'bg-blue-500', label: 'Gerente' },
            cashier: { color: 'bg-green-500', label: 'Cajero' },
            cook: { color: 'bg-orange-500', label: 'Cocinero' },
            delivery: { color: 'bg-yellow-500', label: 'Repartidor' },
            accountant: { color: 'bg-indigo-500', label: 'Contador' }
        }
        return variants[role] || { color: 'bg-gray-500', label: role }
    }

    // Allow super_admin AND admin to access page (with restrictions)
    if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="p-8">
                    <div className="text-center">
                        <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#0B2B26] tracking-tight">Administración de Usuarios</h1>
                    <p className="text-muted-foreground">Gestión de usuarios, roles y permisos</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateUser}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                            <DialogDescription>
                                {selectedUser ? 'Actualiza la información y permisos del usuario' : 'Crea un nuevo usuario y asigna sus permisos'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre Completo</Label>
                                    <Input
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        required
                                        disabled={!!selectedUser}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="usuario@ejemplo.com"
                                    />
                                </div>
                            </div>

                            {!selectedUser && (
                                <div className="space-y-2">
                                    <Label>Contraseña</Label>
                                    <Input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Rol</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {currentUserRole === 'super_admin' && <SelectItem value="super_admin">Super Admin</SelectItem>}
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="manager">Gerente</SelectItem>
                                            <SelectItem value="cashier">Cajero</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {currentUserRole === 'super_admin' && (
                                    <div className="space-y-2">
                                        <Label>Tienda</Label>
                                        <Select
                                            value={formData.store_id}
                                            onValueChange={(v) => setFormData({ ...formData, store_id: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Seleccionar tienda" /></SelectTrigger>
                                            <SelectContent>
                                                {stores.map(store => (
                                                    <SelectItem key={store.id} value={store.id}>
                                                        {store.name} ({store.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Requerido para roles no-admin</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <Label className="mb-2 block">Módulos Permitidos</Label>
                                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50/50">
                                    {AVAILABLE_MODULES.map(module => (
                                        <div key={module.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`module-${module.id}`}
                                                checked={(formData.modules || []).includes(module.id)}
                                                onChange={() => toggleModule(module.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor={`module-${module.id}`} className="text-sm font-normal cursor-pointer">
                                                {module.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Estos módulos aparecerán en el menú lateral del usuario.
                                </p>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {selectedUser ? 'Actualizar' : 'Crear Usuario'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Password Reset Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Contraseña</DialogTitle>
                        <DialogDescription>
                            Establece una nueva contraseña para {selectedUser?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nueva Contraseña</Label>
                            <Input
                                type="password"
                                required
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Contraseña</Label>
                            <Input
                                type="password"
                                required
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="Repite la contraseña"
                                minLength={6}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Cambiar Contraseña
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* User Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                            <UserCog className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {users.filter(u => u.is_active).length}
                                </p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Inactivos</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {users.filter(u => !u.is_active).length}
                                </p>
                            </div>
                            <UserX className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {users.filter(u => u.role === 'admin').length}
                                </p>
                            </div>
                            <Shield className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar usuario..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Tienda</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No se encontraron usuarios.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map(user => {
                                    const roleBadge = getRoleBadge(user.role)
                                    const userStore = stores.find(s => s.id === user.store_id)

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                        {user.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{user.full_name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {(user.modules || []).length} módulos
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={roleBadge.color}>
                                                    {roleBadge.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {userStore ? (
                                                    <span className="text-sm font-medium">{userStore.name}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">
                                                        {user.role === 'super_admin' ? 'Global' : 'Sin asignar'}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'} className={user.is_active ? 'bg-green-500' : ''}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditUser(user)}
                                                    >
                                                        <UserCog className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openPasswordDialog(user)}
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleActive(user)}
                                                        className={user.is_active ? 'text-red-500' : 'text-green-500'}
                                                    >
                                                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
