import { useEffect, useState } from 'react'
import { StoreService } from '@/services/store.service'
import { UserService } from '@/services/user.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Store as StoreIcon, Phone, MapPin, User, Power, Edit2 } from 'lucide-react'
import type { UserProfile } from '@/types/database.types'

interface StoreData {
    id: string
    name: string
    code: string
    address: string
    phone: string | null
    manager_id: string | null
    is_active: boolean
    opening_time: string | null
    closing_time: string | null
    manager?: {
        full_name: string
    }
}

export default function StoresPage() {
    const [stores, setStores] = useState<StoreData[]>([])
    const [managers, setManagers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        manager_id: 'none',
        opening_time: '',
        closing_time: '',
        is_active: true
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            console.log('Loading data...')

            // 1. Fetch Users first (needed for manager mapping)
            let allUsers: UserProfile[] = []
            try {
                const usersData = await UserService.getUsers()
                if (usersData) {
                    allUsers = usersData
                    setManagers(usersData.filter(u => u.role === 'manager' || u.role === 'admin'))
                }
            } catch (userError) {
                console.warn('Error loading users (likely RLS restricted):', userError)
                // Proceed without users, managers will just be unmapped
            }

            // 2. Fetch Stores
            try {
                const storesData = await StoreService.getStores()
                console.log('Stores loaded (raw):', storesData)

                if (storesData) {
                    // 3. Manual Join with fallback
                    const enrichedStores = storesData.map((store: any) => {
                        const managerProfile = allUsers.find(u => u.id === store.manager_id)
                        return {
                            ...store,
                            manager: store.manager_id ? {
                                full_name: managerProfile?.full_name || 'No disponible'
                            } : undefined
                        }
                    })

                    setStores(enrichedStores)
                }
            } catch (storeError) {
                console.error('Error loading stores:', storeError)
                alert('Error al cargar las tiendas via API')
            }

        } catch (error) {
            console.error('General error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateDialog = () => {
        setSelectedStore(null)
        setFormData({
            name: '',
            code: '',
            address: '',
            phone: '',
            manager_id: 'none',
            opening_time: '',
            closing_time: '',
            is_active: true
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (store: StoreData) => {
        setSelectedStore(store)
        setFormData({
            name: store.name,
            code: store.code,
            address: store.address,
            phone: store.phone || '',
            manager_id: store.manager_id || 'none',
            opening_time: store.opening_time || '',
            closing_time: store.closing_time || '',
            is_active: store.is_active
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                address: formData.address,
                phone: formData.phone || null,
                manager_id: formData.manager_id === 'none' ? null : formData.manager_id,
                opening_time: formData.opening_time || null,
                closing_time: formData.closing_time || null,
                is_active: formData.is_active
            } as any

            if (selectedStore) {
                await StoreService.updateStore(selectedStore.id, payload)
            } else {
                await StoreService.createStore(payload)
            }

            setIsDialogOpen(false)
            loadData()
        } catch (error: any) {
            console.error('Error in store form:', error)
            if (error?.message?.includes('stores_code_key') || error?.code === '23505') {
                alert('Error: El código de la tienda ya existe. Por favor use otro código.')
            } else {
                alert(error?.message || 'Error al guardar tienda')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleActive = async (store: StoreData) => {
        try {
            await StoreService.toggleActive(store.id, !store.is_active)
            loadData()
        } catch (error: any) {
            alert('Error al cambiar estado')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#0B2B26] tracking-tight">Tiendas</h1>
                    <p className="text-muted-foreground">Gestión de sucursales y puntos de venta</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Tienda
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedStore ? 'Editar Tienda' : 'Nueva Tienda'}</DialogTitle>
                            <DialogDescription>Información de la sucursal</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Sucursal Centro"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código (Único)</Label>
                                    <Input
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="SUC-01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Dirección</Label>
                                <Input
                                    required
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Av. Principal #123"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(442) 123-4567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gerente</Label>
                                    <Select
                                        value={formData.manager_id}
                                        onValueChange={(v) => setFormData({ ...formData, manager_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar gerente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin asignar</SelectItem>
                                            {managers.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hora Apertura</Label>
                                    <Input
                                        type="time"
                                        value={formData.opening_time}
                                        onChange={e => setFormData({ ...formData, opening_time: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hora Cierre</Label>
                                    <Input
                                        type="time"
                                        value={formData.closing_time}
                                        onChange={e => setFormData({ ...formData, closing_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {stores.map(store => (
                    <Card key={store.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                        <div className={`absolute top-0 right-0 p-2 ${store.is_active ? 'bg-green-500' : 'bg-red-500'} text-white text-xs font-bold rounded-bl-xl`}>
                            {store.is_active ? 'ACTIVO' : 'INACTIVO'}
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                    <StoreIcon className="h-6 w-6" />
                                </div>
                                <Badge variant="outline" className="font-mono">{store.code}</Badge>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{store.name}</h3>

                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>{store.address}</span>
                                </div>
                                {store.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <span>{store.phone}</span>
                                    </div>
                                )}
                                {store.manager && (
                                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                                        <User className="h-4 w-4 shrink-0" />
                                        <span>Gerente: {store.manager.full_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(store)}>
                                    <Edit2 className="mr-2 h-3 w-3" /> Editar
                                </Button>
                                <Button
                                    variant={store.is_active ? "destructive" : "default"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleToggleActive(store)}
                                >
                                    <Power className="mr-2 h-3 w-3" />
                                    {store.is_active ? 'Desactivar' : 'Activar'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {stores.length === 0 && !loading && (
                    <div className="col-span-3 text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                        <StoreIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No hay tiendas registradas</p>
                    </div>
                )}
            </div>
        </div>
    )
}
