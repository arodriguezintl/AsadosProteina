import { useEffect, useState, useCallback } from 'react'
import { SupplierService } from '@/services/supplier.service'
import { useAuthStore } from '@/store/auth.store'
import type { LowStockProduct } from '@/types/suppliers'

export function useLowStockAlert() {
    const { storeId } = useAuthStore()
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const check = useCallback(async () => {
        if (!storeId) return
        try {
            setLoading(true)
            const products = await SupplierService.getLowStockProducts(storeId)
            setLowStockProducts(products)
            if (products.length > 0) {
                setIsOpen(true)
            }
        } catch (err) {
            console.error('Error checking low stock:', err)
        } finally {
            setLoading(false)
        }
    }, [storeId])

    // Run once on mount (after login)
    useEffect(() => {
        if (storeId) {
            check()
        }
    }, [storeId, check])

    return {
        lowStockProducts,
        isOpen,
        loading,
        dismiss: () => setIsOpen(false),
        refresh: check,
    }
}
