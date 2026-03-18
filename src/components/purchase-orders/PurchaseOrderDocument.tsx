import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PurchaseOrder } from '@/types/suppliers'

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1e293b', // slate-800
        backgroundColor: '#f8f6f6', // background-light
    },
    container: {
        margin: 30,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    // Header
    header: {
        padding: 30,
        borderBottom: '4px solid #ec5b13', // primary
        backgroundColor: '#ffffff',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    logoBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoPlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
    },
    brandInfo: {
        marginLeft: 12,
        borderLeft: '1px solid #e2e8f0',
        paddingLeft: 12,
    },
    brandName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    brandNit: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 2,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        fontWeight: 'extrabold',
        color: '#ec5b13',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    folioCard: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        border: '1px solid #f1f5f9',
        minWidth: 160,
    },
    folioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    folioLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    folioValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    dateValue: {
        fontSize: 10,
        color: '#334155',
    },
    // Contact Info
    contactInfo: {
        marginTop: 15,
        gap: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    contactText: {
        fontSize: 9,
        color: '#475569',
    },
    icon: {
        color: '#ec5b13',
        fontSize: 9,
    },
    // Info Grid
    infoGrid: {
        flexDirection: 'row',
        gap: 30,
        paddingTop: 20,
        borderTop: '1px solid #f1f5f9',
    },
    infoBlock: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#ec5b13',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
    },
    infoTextBold: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 9,
        color: '#475569',
        marginBottom: 1,
    },
    statusBadge: {
        marginTop: 4,
        backgroundColor: '#fff7ed',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 8,
        color: '#ec5b13',
        fontWeight: 'bold',
        alignSelf: 'flex-start',
    },
    // Table
    main: {
        padding: 30,
    },
    table: {
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#ec5b13',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottom: '1px solid #f1f5f9',
    },
    tableRowAlt: {
        backgroundColor: '#f8fafc',
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
    },
    tableCellBold: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    tableCellSub: {
        fontSize: 7,
        color: '#64748b',
        marginTop: 2,
    },
    // Columns
    colDesc: { flex: 3 },
    colQty: { flex: 1, textAlign: 'center' },
    colPrice: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1, textAlign: 'right' },
    // Totals
    totalsArea: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalsBlock: {
        width: 180,
        gap: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 9,
        color: '#64748b',
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'medium',
        color: '#0f172a',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTop: '2px solid #ec5b13',
        marginTop: 4,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ec5b13',
    },
    // Footer
    footer: {
        padding: 30,
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
    },
    footerGrid: {
        flexDirection: 'row',
        gap: 40,
        marginBottom: 30,
    },
    notesBlock: {
        flex: 1,
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    notesText: {
        fontSize: 8,
        color: '#64748b',
        lineHeight: 1.4,
    },
    signatureArea: {
        flex: 1,
        flexDirection: 'row',
        gap: 15,
        alignItems: 'flex-end',
    },
    signatureBlock: {
        flex: 1,
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderBottom: '1px solid #cbd5e1',
        marginBottom: 6,
    },
    signatureLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    documentIdBlock: {
        flex: 1,
        alignItems: 'center',
    },
    documentIdText: {
        fontSize: 10,
        fontWeight: 'medium',
        color: '#ec5b13',
        marginBottom: 6,
    },
    legalFooter: {
        paddingTop: 15,
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
    },
    legalText: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
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
                <View style={styles.container}>
                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View style={styles.logoBlock}>
                                <View style={styles.logoPlaceholder} />
                                <View style={styles.brandInfo}>
                                    <Text style={styles.brandName}>{storeName}</Text>
                                    <Text style={styles.brandNit}>NIT: 900.123.456-7</Text>
                                </View>
                            </View>
                            <View style={styles.headerRight}>
                                <Text style={styles.title}>Orden de Compra</Text>
                                <View style={styles.folioCard}>
                                    <View style={styles.folioRow}>
                                        <Text style={styles.folioLabel}>Número OC</Text>
                                        <Text style={styles.folioLabel}>Fecha</Text>
                                    </View>
                                    <View style={styles.folioRow}>
                                        <Text style={styles.folioValue}>#{po.folio}</Text>
                                        <Text style={styles.dateValue}>{fmtDate(po.created_at)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoBlock}>
                                <Text style={styles.infoTitle}>Información del Proveedor</Text>
                                <Text style={styles.infoTextBold}>{po.supplier?.name || '—'}</Text>
                                <Text style={styles.infoText}>RFC: {po.supplier?.rfc || '—'}</Text>
                                {po.supplier?.contact_name && <Text style={styles.infoText}>Contacto: {po.supplier.contact_name}</Text>}
                                {po.supplier?.phone && <Text style={styles.infoText}>Tel: {po.supplier.phone}</Text>}
                            </View>
                            <View style={styles.infoBlock}>
                                <Text style={styles.infoTitle}>Detalles de Entrega</Text>
                                <Text style={styles.infoTextBold}>Almacén Principal - Central</Text>
                                <Text style={styles.infoText}>Fecha esperada: {fmtDate(po.expected_date)}</Text>
                                <Text style={styles.infoText}>Condiciones: {po.supplier?.payment_terms || 'Contado'}</Text>
                                <Text style={styles.statusBadge}>
                                    {po.status === 'draft' ? 'BORRADOR' :
                                        po.status === 'sent' ? 'ENVIADA' :
                                            po.status === 'received' ? 'RECIBIDA' : 'CANCELADA'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* MAIN TABLE */}
                    <View style={styles.main}>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colDesc]}>Descripción del Producto</Text>
                                <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
                                <Text style={[styles.tableHeaderCell, styles.colPrice]}>P. Unitario</Text>
                                <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                            </View>

                            {(po.items ?? []).map((item, idx) => (
                                <View
                                    key={item.id}
                                    style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                                >
                                    <View style={styles.colDesc}>
                                        <Text style={styles.tableCellBold}>{item.product?.name || '—'}</Text>
                                        <Text style={styles.tableCellSub}>SKU: {item.product?.sku || '—'} {item.product?.unit_of_measure ? `• ${item.product.unit_of_measure}` : ''}</Text>
                                    </View>
                                    <View style={styles.colQty}>
                                        <Text style={styles.tableCell}>{Number(item.quantity_ordered).toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.colPrice}>
                                        <Text style={styles.tableCell}>{fmt(Number(item.unit_cost))}</Text>
                                    </View>
                                    <View style={styles.colTotal}>
                                        <Text style={styles.tableCellBold}>{fmt(Number(item.subtotal))}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* TOTALS */}
                        <View style={styles.totalsArea}>
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
                        </View>
                    </View>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <View style={styles.footerGrid}>
                            <View style={styles.notesBlock}>
                                <Text style={styles.notesTitle}>Notas e Instrucciones</Text>
                                <Text style={styles.notesText}>
                                    {po.notes || 'Por favor, incluya el número de OC en todas las etiquetas de envío y facturas. Los productos deben entregarse en transporte adecuado.'}
                                </Text>
                            </View>
                            <View style={styles.signatureArea}>
                                <View style={styles.signatureBlock}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signatureLabel}>Firma Autorizada</Text>
                                </View>
                                <View style={styles.documentIdBlock}>
                                    <Text style={styles.documentIdText}>OC-{po.folio}</Text>
                                    <Text style={styles.signatureLabel}>ID Documento</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.legalFooter}>
                            <Text style={styles.legalText}>{storeName.toUpperCase()} — CORTES DE CALIDAD Y SERVICIO PREMIUM</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
