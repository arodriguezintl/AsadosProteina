import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1e293b',
        backgroundColor: '#f8fafc',
    },
    container: {
        margin: 30,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    header: {
        padding: 30,
        backgroundColor: '#0f172a',
        color: '#ffffff',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    periodBadge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        border: '1px solid #334155',
    },
    periodText: {
        fontSize: 9,
        color: '#94a3b8',
    },
    statsHeader: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 10,
    },
    headerStat: {
        flex: 1,
    },
    headerStatLabel: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    headerStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    main: {
        padding: 30,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    kpiGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30,
    },
    kpiCard: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        border: '1px solid #f1f5f9',
        backgroundColor: '#f8fafc',
    },
    kpiLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    kpiTrend: {
        marginTop: 6,
        fontSize: 8,
        fontWeight: 'bold',
    },
    trendUp: { color: '#10b981' },
    trendDown: { color: '#ef4444' },

    table: {
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottom: '1px solid #e2e8f0',
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottom: '1px solid #f1f5f9',
    },
    tableRowAlt: {
        backgroundColor: '#fcfcfc',
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
    
    colProduct: { flex: 3 },
    colCategory: { flex: 2 },
    colQty: { flex: 1, textAlign: 'center' },
    colAmount: { flex: 1, textAlign: 'right' },

    footer: {
        padding: 20,
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
})

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

interface SalesData {
    product_name: string
    category_name: string
    quantity: number
    total_amount: number
}

interface Props {
    data: SalesData[]
    totalRevenue: number
    totalOrders: number
    averageTicket: number
    period: string
    storeName?: string
}

export function SalesReportDocument({ data, totalRevenue, totalOrders, averageTicket, period, storeName = 'Asados Proteína' }: Props) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={styles.title}>Reporte de Ventas</Text>
                            <View style={styles.periodBadge}>
                                <Text style={styles.periodText}>{period}</Text>
                            </View>
                        </View>
                        <View style={styles.statsHeader}>
                            <View style={styles.headerStat}>
                                <Text style={styles.headerStatLabel}>Ingresos Totales</Text>
                                <Text style={styles.headerStatValue}>{fmt(totalRevenue)}</Text>
                            </View>
                            <View style={styles.headerStat}>
                                <Text style={styles.headerStatLabel}>Órdenes Totales</Text>
                                <Text style={styles.headerStatValue}>{totalOrders}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.main}>
                        <Text style={styles.sectionTitle}>Métricas Clave</Text>
                        <View style={styles.kpiGrid}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>Ticket Promedio</Text>
                                <Text style={styles.kpiValue}>{fmt(averageTicket)}</Text>
                                <Text style={[styles.kpiTrend, styles.trendUp]}>+5.2% vs prev</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>Tasa de Conversión</Text>
                                <Text style={styles.kpiValue}>3.4%</Text>
                                <Text style={[styles.kpiTrend, styles.trendUp]}>+1.1% vs prev</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>Productos/Ticket</Text>
                                <Text style={styles.kpiValue}>2.4</Text>
                                <Text style={[styles.kpiTrend, styles.trendDown]}>-0.2% vs prev</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Top Productos Vendidos</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colProduct]}>Producto</Text>
                                <Text style={[styles.tableHeaderCell, styles.colCategory]}>Categoría</Text>
                                <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
                                <Text style={[styles.tableHeaderCell, styles.colAmount]}>Total</Text>
                            </View>

                            {data.map((item, idx) => (
                                <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                                    <Text style={[styles.tableCellBold, styles.colProduct]}>{item.product_name}</Text>
                                    <Text style={[styles.tableCell, styles.colCategory]}>{item.category_name}</Text>
                                    <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                                    <Text style={[styles.tableCellBold, styles.colAmount]}>{fmt(item.total_amount)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{storeName.toUpperCase()} — ANALÍTICA DE NEGOCIO</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
