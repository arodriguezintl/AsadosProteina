import { useState } from 'react'
import { AlertTriangle, Package, X, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LowStockProduct } from '@/types/suppliers'

interface Props {
    products: LowStockProduct[]
    onClose: () => void
    onCreatePO: (products: LowStockProduct[]) => void
}

export function LowStockAlertModal({ products, onClose, onCreatePO }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>(
        products.map(p => p.id)
    )

    const toggleSelection = (productId: string) => {
        setSelectedIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const selectedProducts = products.filter(p => selectedIds.includes(p.id))

    const stockPct = (p: LowStockProduct) => {
        if (!p.min_stock) return 0
        return Math.round((p.current_stock / p.min_stock) * 100)
    }

    const urgencyColor = (pct: number) => {
        if (pct <= 0) return 'text-red-600 bg-red-50 border-red-200'
        if (pct <= 50) return 'text-orange-600 bg-orange-50 border-orange-200'
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }

    const urgencyLabel = (pct: number) => {
        if (pct <= 0) return 'Sin Stock'
        if (pct <= 50) return 'Crítico'
        return 'Bajo'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-orange-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-base">Alerta de Stock Crítico</h2>
                            <p className="text-orange-100 text-xs">
                                {products.length} producto{products.length !== 1 ? 's' : ''} por debajo del mínimo
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Product list */}
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {products.map(p => {
                        const pct = stockPct(p)
                        const isSelected = selectedIds.includes(p.id)
                        return (
                            <div
                                key={p.id}
                                onClick={() => toggleSelection(p.id)}
                                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                            >
                                {/* Checkbox */}
                                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-all ${isSelected
                                    ? 'bg-orange-500 border-orange-500'
                                    : 'border-gray-300'
                                    }`}>
                                    {isSelected && (
                                        <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>

                                {/* Icon */}
                                <div className="p-1.5 bg-orange-100 rounded-full flex-shrink-0">
                                    <Package className="h-3.5 w-3.5 text-orange-600" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Stock: <span className="font-semibold text-red-600">{p.current_stock} {p.unit_of_measure}</span>
                                        {' '}/ Mín: {p.min_stock} {p.unit_of_measure}
                                    </p>
                                    {p.preferred_supplier && (
                                        <p className="text-xs text-blue-600">Proveedor: {p.preferred_supplier.name}</p>
                                    )}
                                </div>

                                {/* Badge */}
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${urgencyColor(pct)}`}>
                                    {urgencyLabel(pct)}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        {selectedIds.length} de {products.length} seleccionados
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Ver más tarde
                        </Button>
                        <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                            disabled={selectedProducts.length === 0}
                            onClick={() => onCreatePO(selectedProducts)}
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Generar OC
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
