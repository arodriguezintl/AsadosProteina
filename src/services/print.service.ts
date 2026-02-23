import type { TicketData } from '@/types/ticket'

function buildTicketHTML(data: TicketData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Ticket ${data.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 80mm;
    padding: 4mm;
    color: #000;
    background: #fff;
  }
  .header { text-align: center; margin-bottom: 6px; }
  .header .brand { font-size: 14px; font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .double-line { border-top: 3px double #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; }
  .items { font-size: 11px; }
  .items .item { display: flex; justify-content: space-between; margin: 2px 0; }
  .items .item .desc { flex: 1; margin: 0 4px; }
  .totals { margin-top: 6px; }
  .totals .row { margin: 1px 0; }
  .grand-total {
    font-size: 15px;
    font-weight: bold;
    text-align: center;
    margin: 6px 0;
    border-top: 3px double #000;
    border-bottom: 3px double #000;
    padding: 3px 0;
  }
  .footer { text-align: center; margin-top: 8px; font-size: 11px; }
  @media print {
    body { width: 80mm; }
    @page { margin: 0; size: 80mm auto; }
  }
</style>
</head>
<body>
  <div class="header">
    <div style="text-align: center; margin-bottom: 4px;">
      <img src="${window.location.origin}/logo.jpg" alt="Logo" style="width: 80px; height: auto; display: block; margin: 0 auto; filter: grayscale(100%);" />
    </div>
    <div class="brand">${data.businessName}</div>
    ${data.address ? `<div>${data.address}</div>` : ''}
    ${data.phone ? `<div>Tel: ${data.phone}</div>` : ''}
  </div>
  <div class="line"></div>

  <div class="row"><span>FECHA: ${data.orderDate}</span><span>HORA: ${data.orderTime}</span></div>
  <div><strong>NO. ORDEN: #${data.orderNumber}</strong></div>
  <div>CAJERO: ${data.cashierEmail}</div>
  <div>TIPO: ${data.orderType === 'pickup' ? 'Para Llevar' : 'Delivery'}</div>

  <div class="line"></div>
  <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11px">
    <span>CANT</span><span style="flex:1;margin:0 4px">DESCRIPCIÓN</span><span>IMPORTE</span>
  </div>
  <div class="line"></div>

  <div class="items">
    ${data.items.map(item => `
      <div class="item">
        <span>${String(item.qty).padStart(3)}</span>
        <span class="desc">${item.description}</span>
        <span>$${item.lineTotal.toFixed(2)}</span>
      </div>
    `).join('')}
  </div>

  <div class="line"></div>
  <div class="totals">
    <div class="row"><span>SUBTOTAL:</span><span>$${data.subtotal.toFixed(2)}</span></div>
    ${data.tax > 0
      ? `<div class="row"><span>IVA (16%):</span><span>$${data.tax.toFixed(2)}</span></div>`
      : `<div class="row"><span>IVA:</span><span>$0.00</span></div>`}
  </div>
  <div class="grand-total">TOTAL: $${data.total.toFixed(2)} ${data.currency}</div>

  ${data.customer ? `
  <div class="line"></div>
  <div style="text-align:center">
    <div>--- CLIENTE: ${data.customer.fullName} ---</div>
  </div>` : ''}

  <div class="line"></div>
  <div class="footer">
    <div>¡Gracias por tu compra!</div>
    <div>Solicita tu factura por WhatsApp</div>
  </div>
</body>
</html>`
}

export const PrintService = {
  printTicket(data: TicketData): void {
    const html = buildTicketHTML(data)
    const win = window.open('', '_blank', 'width=420,height=720,scrollbars=yes')
    if (!win) {
      alert('Por favor permite ventanas emergentes para imprimir el ticket.')
      return
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    // Wait longer (500ms) to ensure the image is loaded before triggering print dialog
    win.focus()
    setTimeout(() => {
      win.print()
    }, 500)
  }
}
