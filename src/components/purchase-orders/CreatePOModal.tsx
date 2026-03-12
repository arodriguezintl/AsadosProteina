import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Package, Wand2, FileText } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PurchaseOrderDocument } from './PurchaseOrderDocument'
import { SupplierService } from '@/services/supplier.service'
import { PurchaseOrderService } from '@/services/purchase-order.service'
import { useAuthStore } from '@/store/auth.store'
import type { Supplier, LowStockProduct, PurchaseOrder } from '@/types/suppliers'

interface POItem {
    product: LowStockProduct
    quantity: number
    unit_cost: number
    auto: boolean // true = auto-calculated, false = manual
}

interface Props {
    preselectedProducts?: LowStockProduct[]
    onClose: () => void
    onCreated?: (po: PurchaseOrder) => void
}

const STEPS = ['Proveedor', 'Productos', 'Confirmar'] as const
type Step = 0 | 1 | 2

export function CreatePOModal({ preselectedProducts = [], onClose, onCreated }: Props) {
    const { storeId, user } = useAuthStore()
    const [step, setStep] = useState<Step>(0)
    const [loading, setLoading] = useState(false)

    // Step 0
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [selectedSupplierId, setSelectedSupplierId] = useState('')
    const [expectedDate, setExpectedDate] = useState('')
    const [notes, setNotes] = useState('')

    // Step 1 — items
    const [items, setItems] = useState<POItem[]>([])

    // Step 2 — created PO for PDF
    const [createdPO, setCreatedPO] = useState<PurchaseOrder | null>(null)

    // Load suppliers
    useEffect(() => {
        if (!storeId) return
        SupplierService.getSuppliers(storeId)
            .then(setSuppliers)
            .catch(console.error)
    }, [storeId])

    // Init items from preselected products
    useEffect(() => {
        if (preselectedProducts.length > 0) {
            setItems(
                preselectedProducts.map(p => ({
                    product: p,
                    quantity: Math.max(p.min_stock * 2 - p.current_stock, p.min_stock), // auto: fill to 2× min
                    unit_cost: 0,
                    auto: true,
                }))
            )
        }
    }, [preselectedProducts])

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId)

    // Update item field
    const updateItem = (idx: number, field: 'quantity' | 'unit_cost', value: number) => {
        setItems(prev =>
            prev.map((item, i) =>
                i === idx ? { ...item, [field]: value, auto: false } : item
            )
        )
    }

    const resetToAuto = (idx: number) => {
        setItems(prev =>
            prev.map((item, i) =>
                i === idx
                    ? {
                        ...item,
                        quantity: Math.max(item.product.min_stock * 2 - item.product.current_stock, item.product.min_stock),
                        auto: true,
                    }
                    : item
            )
        )
    }

    const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0)

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

    // ── Step navigation ───────────────────────────────────────
    const canNext = (): boolean => {
        if (step === 0) return !!selectedSupplierId
        if (step === 1) return items.length > 0 && items.every(i => i.quantity > 0)
        return false
    }

    const handleNext = async () => {
        if (step < 2) {
            setStep((step + 1) as Step)
        }
    }

    const handleBack = () => {
        if (step > 0) setStep((step - 1) as Step)
    }

    // ── Create OC ─────────────────────────────────────────────
    const handleCreate = async () => {
        if (!storeId || !user) return
        setLoading(true)
        try {
            const po = await PurchaseOrderService.createPurchaseOrder(
                {
                    store_id: storeId,
                    supplier_id: selectedSupplierId,
                    notes: notes || undefined,
                    expected_date: expectedDate || undefined,
                    items: items.map(i => ({
                        product_id: i.product.id,
                        quantity_ordered: i.quantity,
                        unit_cost: i.unit_cost,
                    })),
                },
                user.id
            )
            setCreatedPO(po)
            setStep(2)
            onCreated?.(po)
        } catch (err: any) {
            alert('Error al crear OC: ' + (err.message || 'Error desconocido'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <div>
                        <h2 className="font-bold text-lg">Nueva Orden de Compra</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Paso {step + 1} de {STEPS.length}: {STEPS[step]}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Step indicators */}
                <div className="flex px-6 pt-4 pb-2 gap-2">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2 flex-1">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${i < step ? 'bg-green-500 text-white'
                                : i === step ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs font-medium ${i === step ? 'text-orange-600' : 'text-gray-400'}`}>
                                {label}
                            </span>
                            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                    {/* ── STEP 0: Proveedor ── */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Proveedor *</Label>
                                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                                {s.contact_name ? ` — ${s.contact_name}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {suppliers.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        No hay proveedores registrados. Agrégalos desde el módulo de Inventario.
                                    </p>
                                )}
                            </div>

                            {selectedSupplier && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-sm space-y-1">
                                    {selectedSupplier.email && <p className="text-gray-700">📧 {selectedSupplier.email}</p>}
                                    {selectedSupplier.phone && <p className="text-gray-700">📞 {selectedSupplier.phone}</p>}
                                    <p className="text-gray-700">💳 {selectedSupplier.payment_terms}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Fecha de entrega esperada</Label>
                                <Input
                                    type="date"
                                    value={expectedDate}
                                    onChange={e => setExpectedDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Notas</Label>
                                <textarea
                                    className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    rows={2}
                                    placeholder="Instrucciones especiales, condiciones de entrega..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Productos ── */}
                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Wand2 className="h-3 w-3 text-orange-500" />
                                Las cantidades se calcularon automáticamente (2× stock mínimo). Puedes ajustarlas.
                            </p>

                            {items.map((item, idx) => (
                                <div key={item.product.id} className="border rounded-xl p-4 space-y-3 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-orange-500" />
                                            <div>
                                                <p className="font-medium text-sm">{item.product.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Stock actual: {item.product.current_stock} {item.product.unit_of_measure}
                                                    {' • '}Mín: {item.product.min_stock} {item.product.unit_of_measure}
                                                </p>
                                            </div>
                                        </div>
                                        {item.auto ? (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <Wand2 className="h-2.5 w-2.5" /> Auto
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => resetToAuto(idx)}
                                                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                            >
                                                <Wand2 className="h-3 w-3" /> Recalcular
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">
                                                Cantidad a pedir ({item.product.unit_of_measure})
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                                className={item.auto ? 'border-orange-200 bg-orange-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Precio unitario ($)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_cost}
                                                onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <p className="text-sm font-semibold text-gray-700">
                                            Subtotal: {fmt(item.quantity * item.unit_cost)}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No hay productos seleccionados.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: Confirmación + PDF ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {!createdPO ? (
                                <div className="text-center py-8 space-y-4">
                                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Confirmar Orden de Compra</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Proveedor: <strong>{selectedSupplier?.name}</strong>
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {items.length} productos — Total estimado:{' '}
                                            <strong className="text-orange-600">{fmt(total)}</strong>
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleCreate}
                                        disabled={loading}
                                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2 px-8"
                                    >
                                        {loading ? 'Creando OC...' : 'Crear Orden de Compra'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 space-y-4">
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-3xl">✅</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-green-700">¡OC Generada!</h3>
                                        <p className="text-sm text-gray-500">Folio: <strong>{createdPO.folio}</strong></p>
                                    </div>
                                    <PDFDownloadLink
                                        document={<PurchaseOrderDocument po={createdPO} />}
                                        fileName={`${createdPO.folio}.pdf`}
                                    >
                                        {({ loading: pdfLoading }) => (
                                            <Button
                                                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                                                disabled={pdfLoading}
                                            >
                                                <FileText className="h-4 w-4" />
                                                {pdfLoading ? 'Preparando PDF...' : 'Descargar PDF'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                    <Button variant="outline" onClick={step === 0 || step === 2 ? onClose : handleBack} size="sm">
                        {step === 0 ? 'Cancelar' : step === 2 ? 'Cerrar' : <><ChevronLeft className="h-4 w-4 mr-1" />Atrás</>}
                    </Button>
                    {step < 1 && (
                        <Button
                            onClick={handleNext}
                            disabled={!canNext()}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                    {step === 1 && (
                        <Button
                            onClick={handleNext}
                            disabled={!canNext()}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            Revisar OC <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
