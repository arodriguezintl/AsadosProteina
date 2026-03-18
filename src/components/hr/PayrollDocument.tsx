import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1e293b',
        backgroundColor: '#f1f5f9',
    },
    container: {
        margin: 30,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    header: {
        padding: 25,
        borderBottom: '4px solid #f97316',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#f97316',
        borderRadius: 10,
    },
    brandName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    voucherTitle: {
        fontSize: 16,
        fontWeight: 'extrabold',
        color: '#f97316',
        textTransform: 'uppercase',
    },
    voucherFolio: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },

    infoSection: {
        padding: 25,
        backgroundColor: '#fff7ed',
        flexDirection: 'row',
        gap: 30,
    },
    infoBlock: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 8,
        color: '#f97316',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    infoSub: {
        fontSize: 9,
        color: '#475569',
        marginTop: 1,
    },

    main: {
        padding: 25,
    },
    columnsGrid: {
        flexDirection: 'row',
        gap: 20,
    },
    payrollColumn: {
        flex: 1,
    },
    columnHeader: {
        backgroundColor: '#f8fafc',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 10,
    },
    columnTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    payrollItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 15,
    },
    itemLabel: {
        fontSize: 9,
        color: '#475569',
    },
    itemValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a',
    },

    totalsSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTop: '2px dashed #e2e8f0',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    netPayBox: {
        width: 200,
        padding: 15,
        backgroundColor: '#0f172a',
        borderRadius: 8,
        alignItems: 'center',
    },
    netPayLabel: {
        fontSize: 10,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    netPayValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },

    footer: {
        padding: 25,
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
    },
    signaturesGrid: {
        flexDirection: 'row',
        gap: 40,
        marginTop: 10,
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
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    legalText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 7,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
})

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

interface PayrollData {
    employee_name: string
    employee_id: string
    position: string
    period_start: string
    period_end: string
    base_salary: number
    overtime: number
    transport_allowance: number
    health_deduction: number
    pension_deduction: number
    other_deductions: number
    net_pay: number
}

interface Props {
    data: PayrollData
    storeName?: string
}

export function PayrollDocument({ data, storeName = 'Asados Proteína' }: Props) {
    const totalEarnings = data.base_salary + data.overtime + data.transport_allowance
    const totalDeductions = data.health_deduction + data.pension_deduction + data.other_deductions

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.logoBlock}>
                            <View style={styles.logoPlaceholder} />
                            <Text style={styles.brandName}>{storeName}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.voucherTitle}>Recibo de Nómina</Text>
                            <Text style={styles.voucherFolio}>ID Empleado: {data.employee_id}</Text>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoLabel}>Empleado</Text>
                            <Text style={styles.infoValue}>{data.employee_name}</Text>
                            <Text style={styles.infoSub}>{data.position}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoLabel}>Periodo de Pago</Text>
                            <Text style={styles.infoValue}>{data.period_start} al {data.period_end}</Text>
                            <Text style={styles.infoSub}>Frecuencia: Quincenal</Text>
                        </View>
                    </View>

                    <View style={styles.main}>
                        <View style={styles.columnsGrid}>
                            {/* Devengados */}
                            <View style={styles.payrollColumn}>
                                <View style={styles.columnHeader}>
                                    <Text style={styles.columnTitle}>Devengados (Ingresos)</Text>
                                </View>
                                <View style={styles.payrollItem}>
                                    <Text style={styles.itemLabel}>Salario Base</Text>
                                    <Text style={styles.itemValue}>{fmt(data.base_salary)}</Text>
                                </View>
                                <View style={styles.payrollItem}>
                                    <Text style={styles.itemLabel}>Horas Extra</Text>
                                    <Text style={styles.itemValue}>{fmt(data.overtime)}</Text>
                                </View>
                                <View style={styles.payrollItem}>
                                    <Text style={styles.itemLabel}>Auxilio Transporte</Text>
                                    <Text style={styles.itemValue}>{fmt(data.transport_allowance)}</Text>
                                </View>
                                <View style={[styles.payrollItem, { marginTop: 10, borderTop: '1px solid #f1f5f9' }]}>
                                    <Text style={[styles.itemLabel, { fontWeight: 'bold' }]}>Total Devengado</Text>
                                    <Text style={[styles.itemValue, { color: '#10b981' }]}>{fmt(totalEarnings)}</Text>
                                </View>
                            </View>

                            {/* Deducciones */}
                            <View style={styles.payrollColumn}>
                                <View style={styles.columnHeader}>
                                    <Text style={styles.columnTitle}>Deducciones</Text>
                                </View>
                                <View style={styles.payrollItem}>
                                    <Text style={styles.itemLabel}>Salud (4%)</Text>
                                    <Text style={styles.itemValue}>{fmt(data.health_deduction)}</Text>
                                </View>
                                <View style={styles.payrollItem}>
                                    <Text style={styles.itemLabel}>Pensión (4%)</Text>
                                    <Text style={styles.itemValue}>{fmt(data.pension_deduction)}</Text>
                                </View>
                                <View style={styles.payrollItem}>
                                    <Text style={styles.itemLabel}>Otras Deducciones</Text>
                                    <Text style={styles.itemValue}>{fmt(data.other_deductions)}</Text>
                                </View>
                                <View style={[styles.payrollItem, { marginTop: 10, borderTop: '1px solid #f1f5f9' }]}>
                                    <Text style={[styles.itemLabel, { fontWeight: 'bold' }]}>Total Deducciones</Text>
                                    <Text style={[styles.itemValue, { color: '#ef4444' }]}>{fmt(totalDeductions)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.totalsSection}>
                            <View style={styles.netPayBox}>
                                <Text style={styles.netPayLabel}>Neto a Pagar</Text>
                                <Text style={styles.netPayValue}>{fmt(data.net_pay)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.signaturesGrid}>
                            <View style={styles.signatureBlock}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Firma del Empleador</Text>
                            </View>
                            <View style={styles.signatureBlock}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Firma del Trabajador</Text>
                            </View>
                        </View>
                        <Text style={styles.legalText}>Este documento es un comprobante de pago de salarios de acuerdo con la legislación vigente.</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
