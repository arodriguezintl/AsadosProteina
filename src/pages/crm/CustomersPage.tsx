import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CustomerService } from '@/services/customer.service'
import type { Customer } from '@/types/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Search, User, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

import { useAuthStore } from '@/store/auth.store'

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<'full_name' | 'total_orders'>('full_name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const { storeId } = useAuthStore()

    useEffect(() => {
        if (storeId) {
            loadCustomers()
        }
    }, [storeId])

    const loadCustomers = async () => {
        if (!storeId) return
        try {
            const data = await CustomerService.getCustomers(storeId)
            setCustomers(data)
        } catch (error) {
            console.error('Error loading customers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return
        try {
            await CustomerService.deleteCustomer(id)
            setCustomers(customers.filter(c => c.id !== id))
        } catch (error: any) {
            console.error('Error deleting customer:', error)
            alert('Error al eliminar cliente: ' + (error.message || 'Error desconocido'))
        }
    }

    const handleSort = (field: 'full_name' | 'total_orders') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const filteredCustomers = customers
        .filter(c =>
            c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        )
        .sort((a, b) => {
            const factor = sortDirection === 'asc' ? 1 : -1
            if (sortField === 'full_name') {
                return a.full_name.localeCompare(b.full_name) * factor
            } else {
                return ((a.total_orders || 0) - (b.total_orders || 0)) * factor
            }
        })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground">Directorio de clientes y puntos de lealtad</p>
                </div>
                <Button asChild>
                    <Link to="/crm/customers/new">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                    </Link>
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, email o teléfono..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead 
                                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                onClick={() => handleSort('full_name')}
                            >
                                <div className="flex items-center gap-2">
                                    Nombre
                                    {sortField === 'full_name' ? (
                                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead 
                                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                onClick={() => handleSort('total_orders')}
                            >
                                <div className="flex items-center gap-2">
                                    Ventas Realizadas
                                    {sortField === 'total_orders' ? (
                                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="h-4 w-4" />
                                        </div>
                                        {customer.full_name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{customer.email}</span>
                                            <span className="text-muted-foreground">{customer.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-orange-600">
                                            {customer.total_orders || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/crm/customers/${customer.id}`}>Ver Detalles</Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(customer.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
