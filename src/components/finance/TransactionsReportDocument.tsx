import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Transaction } from '@/types/finance'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatNumber } from '@/utils/format'

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
        backgroundColor: '#ffffff',
        borderBottom: '4px solid #3b82f6',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'extrabold',
        color: '#1e293b',
        textTransform: 'uppercase',
    },
    logoBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
    },
    brandName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 15,
        padding: 20,
        backgroundColor: '#f8fafc',
    },
    summaryCard: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        border: '1px solid #f1f5f9',
    },
    summaryLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    income: { color: '#10b981' },
    expense: { color: '#ef4444' },
    balance: { color: '#3b82f6' },

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
        backgroundColor: '#3b82f6',
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
        paddingVertical: 10,
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
    },
    
    colDate: { flex: 1.5 },
    colDesc: { flex: 3 },
    colCat: { flex: 2 },
    colMethod: { flex: 1.5 },
    colAmount: { flex: 1.5, textAlign: 'right' },

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
        letterSpacing: 1.5,
    }
})

const fmt = (n: number) => `$${formatNumber(n)}`

interface Props {
    transactions: Transaction[]
    totalIncome: number
    totalExpenses: number
    period: string
    storeName?: string
}

export function TransactionsReportDocument({ transactions, totalIncome, totalExpenses, period, storeName = 'Asados Proteína' }: Props) {
    const balance = totalIncome - totalExpenses

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View style={styles.logoBlock}>
                                <View style={styles.logoPlaceholder} />
                                <Text style={styles.brandName}>{storeName}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.title}>Estado Financiero</Text>
                                <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>Periodo: {period}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Ingresos</Text>
                            <Text style={[styles.summaryValue, styles.income]}>{fmt(totalIncome)}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Gastos</Text>
                            <Text style={[styles.summaryValue, styles.expense]}>{fmt(totalExpenses)}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Balance Neto</Text>
                            <Text style={[styles.summaryValue, styles.balance]}>{fmt(balance)}</Text>
                        </View>
                    </View>

                    <View style={styles.main}>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colDate]}>Fecha</Text>
                                <Text style={[styles.tableHeaderCell, styles.colDesc]}>Descripción</Text>
                                <Text style={[styles.tableHeaderCell, styles.colCat]}>Categoría</Text>
                                <Text style={[styles.tableHeaderCell, styles.colMethod]}>Método</Text>
                                <Text style={[styles.tableHeaderCell, styles.colAmount]}>Monto</Text>
                            </View>

                            {transactions.map((t, idx) => (
                                <View key={t.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                                    <View style={styles.colDate}>
                                        <Text style={styles.tableCell}>{format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: es })}</Text>
                                    </View>
                                    <View style={styles.colDesc}>
                                        <Text style={styles.tableCellBold}>{t.description}</Text>
                                    </View>
                                    <View style={styles.colCat}>
                                        <Text style={styles.tableCell}>{t.category?.name || 'Varios'}</Text>
                                    </View>
                                    <View style={styles.colMethod}>
                                        <Text style={[styles.tableCell, { textTransform: 'capitalize' }]}>{t.payment_method}</Text>
                                    </View>
                                    <View style={styles.colAmount}>
                                        <Text style={[styles.tableCellBold, t.type === 'income' ? styles.income : styles.expense]}>
                                            {t.type === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{storeName.toUpperCase()} — REPORTE DE TRANSACCIONES</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
