import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { PromotionService } from "@/services/promotion.service"
import type { Promotion } from "@/types/promotions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Pencil } from "lucide-react"
import { format } from "date-fns"

export default function PromotionsPage() {
    const navigate = useNavigate()
    const { storeId } = useAuthStore()
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (storeId) {
            loadPromotions()
        }
    }, [storeId])

    const loadPromotions = async () => {
        try {
            setLoading(true)
            const data = await PromotionService.getPromotions(storeId!)
            setPromotions(data)
        } catch (error) {
            console.error('Error loading promotions:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPromotions = promotions.filter(promo =>
        promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Promociones y Descuentos</h1>
                    <p className="text-muted-foreground">Gestiona las campañas y descuentos de temporada.</p>
                </div>
                <Button onClick={() => navigate('/admin/promotions/new')}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Promoción
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar promoción..."
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
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Descuento</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center">Cargando...</TableCell></TableRow>
                        ) : filteredPromotions.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center">No se encontraron promociones.</TableCell></TableRow>
                        ) : (
                            filteredPromotions.map((promo) => (
                                <TableRow key={promo.id}>
                                    <TableCell className="font-medium">{promo.name}</TableCell>
                                    <TableCell>{promo.description}</TableCell>
                                    <TableCell>
                                        {promo.discount_percentage}%
                                    </TableCell>
                                    <TableCell>{format(new Date(promo.start_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{format(new Date(promo.end_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {promo.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/promotions/${promo.id}`)}>
                                            <Pencil className="h-4 w-4" />
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
