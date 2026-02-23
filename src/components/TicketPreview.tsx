import { PrintService } from '@/services/print.service'
import type { TicketData } from '@/types/ticket'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Printer, X } from 'lucide-react'

interface TicketPreviewProps {
    open: boolean
    onClose: () => void
    ticket: TicketData | null
}

export default function TicketPreview({ open, onClose, ticket }: TicketPreviewProps) {
    if (!ticket) return null

    const handlePrint = () => {
        PrintService.printTicket(ticket)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Vista previa del ticket
                    </DialogTitle>
                </DialogHeader>

                {/* Ticket preview — mimics 80mm thermal paper */}
                <div
                    className="bg-white border rounded-md p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-[60vh] text-black"
                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                >
                    <div className="flex justify-center mb-2">
                        <img src="/logo.jpg" alt="Logo" className="w-20 h-auto object-contain grayscale" />
                    </div>
                    <div className="text-center font-bold text-sm">{ticket.businessName}</div>
                    {ticket.address && <div className="text-center">{ticket.address}</div>}
                    {ticket.phone && <div className="text-center">Tel: {ticket.phone}</div>}

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    <div className="flex justify-between">
                        <span>FECHA: {ticket.orderDate}</span>
                        <span>HORA: {ticket.orderTime}</span>
                    </div>
                    <div className="font-bold">NO. ORDEN: #{ticket.orderNumber}</div>
                    <div>CAJERO: {ticket.cashierEmail}</div>
                    <div>TIPO: {ticket.orderType === 'pickup' ? 'Para Llevar' : 'Delivery'}</div>

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-1">
                        <span>CANT</span>
                        <span className="flex-1 mx-2">DESCRIPCIÓN</span>
                        <span>IMPORTE</span>
                    </div>

                    {ticket.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                            <span className="text-right w-6">{item.qty}</span>
                            <span className="flex-1 mx-2 truncate">{item.description}</span>
                            <span className="text-right">${item.lineTotal.toFixed(2)}</span>
                        </div>
                    ))}

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>${ticket.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>IVA:</span>
                        <span>${ticket.tax.toFixed(2)}</span>
                    </div>

                    <div className="border-t-2 border-double border-b-2 border-gray-800 my-2 py-1 text-center font-bold text-sm">
                        TOTAL: ${ticket.total.toFixed(2)} {ticket.currency}
                    </div>

                    {ticket.customer && (
                        <div className="text-center mt-2">
                            <div className="border-t border-dashed border-gray-400 mb-2" />
                            <div>--- CLIENTE: {ticket.customer.fullName} ---</div>
                        </div>
                    )}

                    <div className="border-t border-dashed border-gray-400 my-2" />
                    <div className="text-center">
                        <div>¡Gracias por tu compra!</div>
                        <div>Solicita tu factura por WhatsApp</div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        <X className="h-4 w-4 mr-2" />
                        Cerrar
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
