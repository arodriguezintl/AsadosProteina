import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Users, DollarSign, Search, Edit, Calendar, UserCheck, UserX } from 'lucide-react'
import { HRService } from '@/services/hr.service'
import { UserService } from '@/services/user.service'
import { useAuthStore } from '@/store/auth.store'
import type { Employee, Payroll } from '@/types/hr'
import type { UserRole } from '@/types/database.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface EmployeeWithShift extends Employee {
    activeShift?: any
}

export default function HRPage() {
    const [activeTab, setActiveTab] = useState<'employees' | 'time' | 'payroll'>('employees')
    const [employees, setEmployees] = useState<EmployeeWithShift[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [formData, setFormData] = useState<Partial<Employee> & {
        email?: string,
        password?: string,
        role?: UserRole,
        create_user?: boolean
    }>({})
    const [payrolls, setPayrolls] = useState<Payroll[]>([])
    const [payrollFormData, setPayrollFormData] = useState({
        employee_id: '',
        period_start: '',
        period_end: ''
    })

    // Stats State
    const [stats, setStats] = useState({
        usersPerStore: [] as { storeName: string, count: number }[],
        recentChanges: [] as Employee[]
    })

    const { storeId: currentStoreId } = useAuthStore()
    const STORE_ID = currentStoreId || '00000000-0000-0000-0000-000000000001' // Fallback or handle null

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {

            if (activeTab === 'employees' || activeTab === 'time') {
                const data = await HRService.getEmployees(STORE_ID)

                // Calculate stats
                // Mocking store names for now as we only fetch for current store usually
                // In a real scenario we might need to fetch all stores if we are SuperAdmin
                const activeCount = data.filter(e => e.is_active).length
                const storeCount = { storeName: 'Tienda Actual', count: activeCount }

                // Recent changes: simple sort by created_at or updated if available (mocking with slice)
                const recent = [...data].sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())).slice(0, 5)

                setStats({
                    usersPerStore: [storeCount],
                    recentChanges: recent
                })

                if (activeTab === 'time') {
                    // Control Horario disabled for now
                    // ... existing logic if enabled
                    const employeesWithShifts = await Promise.all(
                        data.map(async (emp) => {
                            // ... existing logic ...
                            return { ...emp, activeShift: null }
                        })
                    )
                    setEmployees(employeesWithShifts)
                } else {
                    setEmployees(data)
                }
            } else if (activeTab === 'payroll') {
                const data = await HRService.getPayrolls(STORE_ID)
                setPayrolls(data)
                const empData = await HRService.getEmployees(STORE_ID)
                setEmployees(empData)
            }
        } catch (error) {
            console.error('Error loading HR data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredEmployees = employees.filter(e =>
        e.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handlePositionChange = (position: string) => {
        let newRole: UserRole | undefined = undefined
        let createUser = false

        // Map Position to Role
        switch (position) {
            case 'Admin':
                newRole = 'admin'
                createUser = true
                break
            case 'Gerente':
                newRole = 'manager'
                createUser = true
                break
            case 'Cajero':
                newRole = 'cashier'
                createUser = true
                break
            case 'Staff':
                newRole = undefined
                createUser = false
                break
            default:
                newRole = undefined
                createUser = false
        }

        setFormData(prev => ({
            ...prev,
            position,
            role: newRole,
            create_user: createUser
        }))
    }

    const handleEmployeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Starting handleEmployeeSubmit...')
        setLoading(true)

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            console.error('Safety timeout triggered in handleEmployeeSubmit')
            setLoading(false)
            alert('La operación está tardando demasiado. Por favor verifica si el usuario se creó.')
        }, 15000)

        try {
            console.log('Form Data:', formData)
            let userId = selectedEmployee?.user_id

            // Handle User Creation if requested and credentials provided
            if (formData.create_user && formData.email && formData.password && !userId) {
                const userData = {
                    email: formData.email,
                    password: formData.password,
                    full_name: `${formData.first_name} ${formData.last_name}`,
                    role: formData.role || 'cashier',
                    store_id: STORE_ID,
                    modules: ['dashboard', 'pos', 'orders'] as any[] // Default modules, cast to avoid lint error or import ModuleName
                }
                const newUser = await UserService.createUser(userData)
                if (newUser && newUser.user) {
                    userId = newUser.user.id
                }
            }

            const employeeData: Partial<Employee> = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                position: formData.position,
                phone: formData.phone,
                salary_type: formData.salary_type,
                salary_amount: formData.salary_amount,
                is_active: formData.is_active,
                store_id: STORE_ID,
                user_id: userId // Link the user
            }

            if (selectedEmployee) {
                // Update User if needed
                if (selectedEmployee.user_id) {
                    if (formData.password) {
                        try {
                            await UserService.resetPassword(selectedEmployee.user_id, formData.password)
                        } catch (pwError) {
                            console.error("Error updating password", pwError)
                        }
                    }
                    if (formData.role && selectedEmployee.user?.role !== formData.role) {
                        // Update user role
                        const currentUser = await UserService.getUserById(selectedEmployee.user_id)
                        if (currentUser) {
                            await UserService.updateUser(selectedEmployee.user_id, { role: formData.role })
                        }
                    }
                }

                await HRService.updateEmployee(selectedEmployee.id, employeeData)
            } else {
                await HRService.createEmployee({ ...employeeData, is_active: true } as Employee)
            }
            setIsDialogOpen(false)
            setSelectedEmployee(null)
            setFormData({})
            loadData()
        } catch (error: any) {
            console.error('Error saving employee:', error)
            let errorMessage = error?.message || "Error desconocido"
            // Start of improved error handling
            if (error && typeof error === 'object' && 'context' in error) {
                // FunctionsHttpError often has a context property with the response
                try {
                    const context = (error as any).context;
                    if (context && typeof context.json === 'function') {
                        const body = await context.json();
                        if (body && body.error) {
                            errorMessage = body.error;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing function response", e)
                }
            }
            alert(`Error al guardar empleado: ${errorMessage}`)
        } finally {
            clearTimeout(safetyTimeout)
            setLoading(false)
        }
    }

    const handleToggleActive = async (employee: Employee) => {
        if (!confirm(`¿Estás seguro de que quieres ${employee.is_active ? 'desactivar' : 'activar'} a este empleado?`)) return

        try {
            await HRService.updateEmployee(employee.id, { is_active: !employee.is_active })
            loadData()
        } catch (error: any) {
            alert(error?.message || 'Error al cambiar estado del empleado')
        }
    }

    /*
    const handleClockIn = async (employeeId: string) => {
        try {
            await HRService.clockIn(employeeId, STORE_ID)
            loadData()
        } catch (error: any) {
            alert(error?.message || 'Error al registrar entrada')
        }
    }

    const handleClockOut = async (employeeId: string) => {
        try {
            await HRService.clockOut(employeeId)
            loadData()
        } catch (error: any) {
            alert(error?.message || 'Error al registrar salida')
        }
    }
    */

    const handleGeneratePayroll = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await HRService.generatePayroll(
                payrollFormData.employee_id,
                payrollFormData.period_start,
                payrollFormData.period_end
            )
            setIsPayrollDialogOpen(false)
            setPayrollFormData({ employee_id: '', period_start: '', period_end: '' })
            loadData()
        } catch (error: any) {
            alert(error?.message || 'Error al generar nómina')
        } finally {
            setLoading(false)
        }
    }

    const openEditEmployee = (emp: Employee) => {
        setSelectedEmployee(emp)
        setFormData({
            ...emp,
            email: emp.user?.email,
            role: emp.user?.role,
            create_user: false
        })
        setIsDialogOpen(true)
    }

    const openCreateEmployee = () => {
        setSelectedEmployee(null)
        setFormData({
            salary_type: 'hourly',
            salary_amount: 0,
            position: 'Staff',
            // Default to Staff logic
            role: undefined,
            create_user: false
        })
        setIsDialogOpen(true)
    }

    // --- Render Functions ---

    const renderEmployees = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar empleado..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateEmployee}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Empleado
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
                            <DialogDescription>Ingresa los datos del colaborador.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        required
                                        value={formData.first_name || ''}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido</Label>
                                    <Input
                                        required
                                        value={formData.last_name || ''}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Puesto</Label>
                                    <Select
                                        value={formData.position}
                                        onValueChange={handlePositionChange}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Gerente">Gerente</SelectItem>
                                            <SelectItem value="Cajero">Cajero</SelectItem>
                                            <SelectItem value="Staff">Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo Salario</Label>
                                    <Select
                                        value={formData.salary_type}
                                        onValueChange={v => setFormData({ ...formData, salary_type: v as any })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Por Hora</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="monthly">Mensual</SelectItem>
                                            <SelectItem value="per_delivery">Por Entrega</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Monto Salario ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.salary_amount || 0}
                                        onChange={e => setFormData({ ...formData, salary_amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* User User Creation / Edit Fields */}
                            <div className="space-y-4 border-t pt-4">
                                {!selectedEmployee ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="create_user"
                                            checked={formData.create_user}
                                            onChange={e => setFormData({ ...formData, create_user: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300"
                                            disabled={['Admin', 'Gerente', 'Cajero'].includes(formData.position || '')}
                                        />
                                        <Label htmlFor="create_user">Crear Usuario de Sistema</Label>
                                    </div>
                                ) : (
                                    <h4 className="font-medium text-sm">Acceso al Sistema</h4>
                                )}

                                {(formData.create_user || (selectedEmployee && selectedEmployee.user_id)) && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    disabled={!!selectedEmployee} // Cannot change email easily for now
                                                    value={formData.email || ''}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{selectedEmployee ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Label>
                                                <Input
                                                    type="password"
                                                    value={formData.password || ''}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder={selectedEmployee ? "Dejar vacío para mantener" : ""}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rol de Sistema</Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={v => setFormData({ ...formData, role: v as UserRole })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Seleccionar Rol" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Administrador</SelectItem>
                                                    <SelectItem value="manager">Gerente</SelectItem>
                                                    <SelectItem value="cashier">Cajero</SelectItem>
                                                    <SelectItem value="cook">Cocinero</SelectItem>
                                                    <SelectItem value="delivery">Repartidor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Puesto</TableHead>
                                <TableHead>Salario</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No se encontraron empleados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <TableRow key={emp.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-primary cursor-pointer hover:underline" onClick={() => openEditEmployee(emp)}>
                                                    {emp.first_name} {emp.last_name}
                                                </span>
                                                {emp.user_id && (
                                                    <Badge variant="secondary" className="w-fit text-[10px] h-4 px-1 mt-1">Usuario Sistema</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{emp.position}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            ${emp.salary_amount?.toFixed(2)} / {
                                                emp.salary_type === 'hourly' ? 'Hr' :
                                                    emp.salary_type === 'weekly' ? 'Sem' :
                                                        emp.salary_type === 'monthly' ? 'Mes' : 'Entrega'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={emp.is_active ? 'default' : 'secondary'} className={emp.is_active ? 'bg-green-500' : ''}>
                                                {emp.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditEmployee(emp)}>
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleActive(emp)}
                                                    className={emp.is_active ? 'text-red-500' : 'text-green-500'}
                                                    title={emp.is_active ? 'Desactivar' : 'Activar'}
                                                >
                                                    {emp.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )

    /*
    const renderTimeTracking = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : employees.filter(e => e.is_active).map(emp => (
                    <Card key={emp.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{emp.first_name} {emp.last_name}</CardTitle>
                                    <CardDescription>{emp.position}</CardDescription>
                                </div>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className="flex items-center justify-between mt-2">
                                <div className="text-xs text-muted-foreground">Estado Actual</div>
                                {emp.activeShift ? (
                                    <Badge className="text-xs bg-green-500">En Turno</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs">Sin Turno</Badge>
                                )}
                            </div>
                            {emp.activeShift && (
                                <div className="text-xs text-muted-foreground mt-2">
                                    Entrada: {format(new Date(emp.activeShift.check_in), 'HH:mm', { locale: es })}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => handleClockIn(emp.id)}
                                    disabled={!!emp.activeShift}
                                >
                                    <LogIn className="mr-2 h-3 w-3" /> Entrada
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleClockOut(emp.id)}
                                    disabled={!emp.activeShift}
                                >
                                    <LogOut className="mr-2 h-3 w-3" /> Salida
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
    */

    const renderPayroll = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Nóminas Generadas</h3>
                <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Generar Nómina
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generar Nómina</DialogTitle>
                            <DialogDescription>Selecciona el empleado y el periodo de pago.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleGeneratePayroll} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Empleado</Label>
                                <Select
                                    value={payrollFormData.employee_id}
                                    onValueChange={v => setPayrollFormData({ ...payrollFormData, employee_id: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                                    <SelectContent>
                                        {employees.filter(e => e.is_active).map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.first_name} {emp.last_name} - {emp.position}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Fecha Inicio</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={payrollFormData.period_start}
                                        onChange={e => setPayrollFormData({ ...payrollFormData, period_start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Fin</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={payrollFormData.period_end}
                                        onChange={e => setPayrollFormData({ ...payrollFormData, period_end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Generar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Periodo</TableHead>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Horas</TableHead>
                                <TableHead>Total Pagado</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : payrolls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay nóminas generadas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payrolls.map(payroll => (
                                    <TableRow key={payroll.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {format(new Date(payroll.period_start), 'dd MMM', { locale: es })} - {format(new Date(payroll.period_end), 'dd MMM yyyy', { locale: es })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {payroll.employee ? `${payroll.employee.first_name} ${payroll.employee.last_name}` : 'N/A'}
                                        </TableCell>
                                        <TableCell>{payroll.total_hours?.toFixed(2) || '0.00'} hrs</TableCell>
                                        <TableCell className="font-semibold">${payroll.total_paid?.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                                                {payroll.status === 'paid' ? 'Pagado' : 'Borrador'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0B2B26] tracking-tight">Recursos Humanos</h1>
                    <p className="text-muted-foreground">Gestión de empleados, control de horas y nómina.</p>
                </div>
            </div>

            {/* Removed Control Horario Tab Button in render, check below */}
            <div className="flex space-x-1 bg-muted/20 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'employees' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:bg-white/50'
                        }`}
                >
                    <Users className="h-4 w-4" /> Personal
                </button>
                {/* 
                <button
                    onClick={() => setActiveTab('time')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'time' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:bg-white/50'
                        }`}
                >
                    <Clock className="h-4 w-4" /> Control Horario
                </button>
                */}
                <button
                    onClick={() => setActiveTab('payroll')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payroll' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:bg-white/50'
                        }`}
                >
                    <DollarSign className="h-4 w-4" /> Nómina
                </button>
            </div>

            {/* Stats Cards */}
            {activeTab === 'employees' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios por Tienda</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.usersPerStore.map((s, i) => (
                                <div key={i} className="flex justify-between items-center mb-1">
                                    <span className="text-sm">{s.storeName}</span>
                                    <span className="font-bold">{s.count}</span>
                                </div>
                            ))}
                            {stats.usersPerStore.length === 0 && <span className="text-2xl font-bold">0</span>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Cambios Recientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {stats.recentChanges.map(e => (
                                    <div key={e.id} className="text-xs flex justify-between">
                                        <span>{e.first_name} {e.last_name}</span>
                                        <span className="text-muted-foreground">{e.position}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'employees' && renderEmployees()}
            {/* {activeTab === 'time' && renderTimeTracking()} */}
            {activeTab === 'payroll' && renderPayroll()}
        </div>
    )
}
