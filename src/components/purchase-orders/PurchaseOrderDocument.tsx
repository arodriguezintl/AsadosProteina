import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PurchaseOrder } from '@/types/suppliers'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1a1a1a',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
        paddingBottom: 16,
        borderBottom: '2px solid #e85d04',
    },
    brandBlock: {
        flex: 1,
    },
    brandName: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: '#e85d04',
        marginBottom: 2,
    },
    brandSub: {
        fontSize: 9,
        color: '#666',
    },
    folioBlock: {
        alignItems: 'flex-end',
    },
    folioLabel: {
        fontSize: 9,
        color: '#666',
        marginBottom: 2,
    },
    folioValue: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#e85d04',
    },
    statusBadge: {
        marginTop: 4,
        backgroundColor: '#fff3e0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 8,
        color: '#e85d04',
        fontFamily: 'Helvetica-Bold',
    },
    // Date row
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    dateMeta: {
        fontSize: 9,
        color: '#555',
    },
    // Cards
    cardsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        flex: 1,
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        padding: 12,
    },
    cardTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#e85d04',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    cardRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    cardLabel: {
        fontSize: 8,
        color: '#888',
        width: 60,
    },
    cardValue: {
        fontSize: 9,
        color: '#111',
        flex: 1,
    },
    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e85d04',
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginBottom: 2,
    },
    tableHeaderCell: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#fff',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottom: '1px solid #f3f4f6',
    },
    tableRowAlt: {
        backgroundColor: '#fafafa',
    },
    tableCell: {
        fontSize: 9,
        color: '#333',
    },
    // Column widths
    colNum: { width: 24 },
    colSku: { width: 70 },
    colName: { flex: 1 },
    colQty: { width: 50, textAlign: 'right' },
    colUnit: { width: 40, textAlign: 'center' },
    colCost: { width: 60, textAlign: 'right' },
    colSubtotal: { width: 70, textAlign: 'right' },
    // Totals
    totalsBlock: {
        alignSelf: 'flex-end',
        marginTop: 16,
        width: 200,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    totalLabel: {
        fontSize: 9,
        color: '#555',
    },
    totalValue: {
        fontSize: 9,
        color: '#111',
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderTop: '2px solid #e85d04',
        marginTop: 4,
    },
    grandTotalLabel: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#e85d04',
    },
    grandTotalValue: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#e85d04',
    },
    // Notes
    notesBlock: {
        marginTop: 24,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        border: '1px solid #e5e7eb',
    },
    notesTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#555',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 9,
        color: '#444',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1px solid #e5e7eb',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#999',
    },
})

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const fmtDate = (s?: string) => {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

interface Props {
    po: PurchaseOrder
    storeName?: string
}

export function PurchaseOrderDocument({ po, storeName = 'Asados Proteína' }: Props) {
    const subtotal = po.items?.reduce((s, i) => s + Number(i.subtotal), 0) ?? 0

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.brandBlock}>
                        <Text style={styles.brandName}>{storeName}</Text>
                        <Text style={styles.brandSub}>Orden de Compra a Proveedor</Text>
                    </View>
                    <View style={styles.folioBlock}>
                        <Text style={styles.folioLabel}>Número de OC</Text>
                        <Text style={styles.folioValue}>{po.folio}</Text>
                        <Text style={styles.statusBadge}>
                            {po.status === 'draft' ? 'BORRADOR' :
                                po.status === 'sent' ? 'ENVIADA' :
                                    po.status === 'received' ? 'RECIBIDA' : 'CANCELADA'}
                        </Text>
                    </View>
                </View>

                {/* DATES */}
                <View style={styles.dateRow}>
                    <Text style={styles.dateMeta}>Fecha de emisión: {fmtDate(po.created_at)}</Text>
                    {po.expected_date && (
                        <Text style={styles.dateMeta}>Fecha de entrega esperada: {fmtDate(po.expected_date)}</Text>
                    )}
                </View>

                {/* INFO CARDS */}
                <View style={styles.cardsRow}>
                    {/* Proveedor */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Proveedor</Text>
                        <View style={styles.cardRow}>
                            <Text style={styles.cardLabel}>Nombre:</Text>
                            <Text style={styles.cardValue}>{po.supplier?.name ?? '—'}</Text>
                        </View>
                        {po.supplier?.contact_name && (
                            <View style={styles.cardRow}>
                                <Text style={styles.cardLabel}>Contacto:</Text>
                                <Text style={styles.cardValue}>{po.supplier.contact_name}</Text>
                            </View>
                        )}
                        {po.supplier?.email && (
                            <View style={styles.cardRow}>
                                <Text style={styles.cardLabel}>Email:</Text>
                                <Text style={styles.cardValue}>{po.supplier.email}</Text>
                            </View>
                        )}
                        {po.supplier?.phone && (
                            <View style={styles.cardRow}>
                                <Text style={styles.cardLabel}>Teléfono:</Text>
                                <Text style={styles.cardValue}>{po.supplier.phone}</Text>
                            </View>
                        )}
                        {po.supplier?.rfc && (
                            <View style={styles.cardRow}>
                                <Text style={styles.cardLabel}>RFC:</Text>
                                <Text style={styles.cardValue}>{po.supplier.rfc}</Text>
                            </View>
                        )}
                    </View>
                    {/* Condiciones */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Condiciones</Text>
                        <View style={styles.cardRow}>
                            <Text style={styles.cardLabel}>Pago:</Text>
                            <Text style={styles.cardValue}>{po.supplier?.payment_terms ?? 'Contado'}</Text>
                        </View>
                        <View style={styles.cardRow}>
                            <Text style={styles.cardLabel}>OC #:</Text>
                            <Text style={styles.cardValue}>{po.folio}</Text>
                        </View>
                    </View>
                </View>

                {/* TABLE */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
                    <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
                    <Text style={[styles.tableHeaderCell, styles.colName]}>DESCRIPCIÓN</Text>
                    <Text style={[styles.tableHeaderCell, styles.colQty]}>CANT.</Text>
                    <Text style={[styles.tableHeaderCell, styles.colUnit]}>U/M</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCost]}>P.UNIT</Text>
                    <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>SUBTOTAL</Text>
                </View>

                {(po.items ?? []).map((item, idx) => (
                    <View
                        key={item.id}
                        style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                    >
                        <Text style={[styles.tableCell, styles.colNum]}>{idx + 1}</Text>
                        <Text style={[styles.tableCell, styles.colSku]}>{item.product?.sku ?? '—'}</Text>
                        <Text style={[styles.tableCell, styles.colName]}>{item.product?.name ?? '—'}</Text>
                        <Text style={[styles.tableCell, styles.colQty]}>{Number(item.quantity_ordered).toFixed(2)}</Text>
                        <Text style={[styles.tableCell, styles.colUnit]}>{item.product?.unit_of_measure ?? ''}</Text>
                        <Text style={[styles.tableCell, styles.colCost]}>{fmt(Number(item.unit_cost))}</Text>
                        <Text style={[styles.tableCell, styles.colSubtotal]}>{fmt(Number(item.subtotal))}</Text>
                    </View>
                ))}

                {/* TOTALS */}
                <View style={styles.totalsBlock}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>{fmt(subtotal)}</Text>
                    </View>
                </View>

                {/* NOTES */}
                {po.notes && (
                    <View style={styles.notesBlock}>
                        <Text style={styles.notesTitle}>NOTAS</Text>
                        <Text style={styles.notesText}>{po.notes}</Text>
                    </View>
                )}

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{storeName} — Documento generado automáticamente</Text>
                    <Text style={styles.footerText}>OC {po.folio} • {fmtDate(po.created_at)}</Text>
                </View>
            </Page>
        </Document>
    )
}
