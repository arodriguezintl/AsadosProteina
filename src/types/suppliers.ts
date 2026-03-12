// ============================================================
// Tipos TypeScript — Módulo de Proveedores y Órdenes de Compra
// ============================================================

export interface Supplier {
    id: string
    store_id: string
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    rfc?: string
    payment_terms: string
    notes?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreateSupplierDTO {
    store_id: string
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    rfc?: string
    payment_terms?: string
    notes?: string
    is_active?: boolean
}

export interface UpdateSupplierDTO extends Partial<Omit<CreateSupplierDTO, 'store_id'>> { }

// ── Relación Producto — Proveedor ─────────────────────────────
export interface ProductSupplier {
    id: string
    product_id: string
    supplier_id: string
    supplier_sku?: string
    unit_cost: number
    lead_time_days: number
    is_preferred: boolean
    created_at: string

    // Populated joins
    supplier?: Supplier
}

export interface CreateProductSupplierDTO {
    product_id: string
    supplier_id: string
    supplier_sku?: string
    unit_cost: number
    lead_time_days?: number
    is_preferred?: boolean
}

// ── Orden de Compra ───────────────────────────────────────────
export type POStatus = 'draft' | 'sent' | 'received' | 'cancelled'

export interface PurchaseOrder {
    id: string
    store_id: string
    supplier_id: string
    folio: string
    status: POStatus
    notes?: string
    total_amount: number
    expected_date?: string
    received_at?: string
    created_by?: string
    created_at: string
    updated_at: string

    // Populated joins
    supplier?: Supplier
    items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
    id: string
    purchase_order_id: string
    product_id: string
    quantity_ordered: number
    unit_cost: number
    subtotal: number
    quantity_received: number
    notes?: string

    // Populated
    product?: {
        id: string
        name: string
        sku: string
        unit_of_measure: string
    }
}

export interface CreatePurchaseOrderDTO {
    store_id: string
    supplier_id: string
    notes?: string
    expected_date?: string
    items: {
        product_id: string
        quantity_ordered: number
        unit_cost: number
    }[]
}

// ── Alertas de Stock Bajo ─────────────────────────────────────
export interface LowStockProduct {
    id: string
    name: string
    sku: string
    current_stock: number
    min_stock: number
    unit_of_measure: string
    store_id: string
    preferred_supplier?: Supplier
}
