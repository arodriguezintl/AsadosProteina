import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SupplierService } from '@/services/supplier.service'
import { useAuthStore } from '@/store/auth.store'
import type { Supplier } from '@/types/suppliers'

export default function SuppliersPage() {
    const { storeId } = useAuthStore()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        rfc: '',
        address: '',
        payment_terms: 'Contado',
    })

    useEffect(() => {
        if (storeId) loadSuppliers()
    }, [storeId])

    const loadSuppliers = async () => {
        if (!storeId) return
        setLoading(true)
        try {
            const data = await SupplierService.getSuppliers(storeId)
            setSuppliers(data)
        } catch (error) {
            console.error('Error loading suppliers:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingSupplier(null)
        setFormData({
            name: '',
            contact_name: '',
            email: '',
            phone: '',
            rfc: '',
            address: '',
            payment_terms: 'Contado',
        })
        setIsModalOpen(true)
    }

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setFormData({
            name: supplier.name,
            contact_name: supplier.contact_name || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            rfc: supplier.rfc || '',
            address: supplier.address || '',
            payment_terms: supplier.payment_terms || 'Contado',
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeId) return

        try {
            if (editingSupplier) {
                await SupplierService.updateSupplier(editingSupplier.id, formData)
            } else {
                await SupplierService.createSupplier({ ...formData, store_id: storeId })
            }
            setIsModalOpen(false)
            loadSuppliers()
        } catch (error) {
            console.error('Error saving supplier:', error)
            alert('Error al guardar el proveedor')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este proveedor?')) return
        try {
            await SupplierService.deleteSupplier(id)
            loadSuppliers()
        } catch (error) {
            console.error('Error deleting supplier:', error)
            alert('Error al eliminar el proveedor')
        }
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rfc?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
                    <p className="text-sm text-gray-500">Gestión de contactos para reabastecimiento</p>
                </div>
                <Button onClick={openCreateModal} className="bg-orange-500 hover:bg-orange-600 gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Proveedor
                </Button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, contacto o RFC..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Email / Tel</TableHead>
                                <TableHead>Condiciones</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell>
                                </TableRow>
                            ) : filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        No se encontraron proveedores.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map(supplier => (
                                    <TableRow key={supplier.id}>
                                        <TableCell>
                                            <div className="font-medium">{supplier.name}</div>
                                            <div className="text-xs text-gray-500">{supplier.rfc}</div>
                                        </TableCell>
                                        <TableCell>{supplier.contact_name || '—'}</TableCell>
                                        <TableCell>
                                            <div className="text-xs">{supplier.email}</div>
                                            <div className="text-xs">{supplier.phone}</div>
                                        </TableCell>
                                        <TableCell>{supplier.payment_terms}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="icon" variant="ghost" onClick={() => openEditModal(supplier)}>
                                                    <Edit3 className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(supplier.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Crear/Editar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre / Razón Social *</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rfc">RFC</Label>
                                <Input
                                    id="rfc"
                                    value={formData.rfc}
                                    onChange={e => setFormData({ ...formData, rfc: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_name">Contacto Principal</Label>
                                <Input
                                    id="contact_name"
                                    value={formData.contact_name}
                                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_terms">Condiciones de pago</Label>
                            <Input
                                id="payment_terms"
                                value={formData.payment_terms}
                                onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                                placeholder="Ej: Contado, Crédito 15 días..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                                Guardar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
