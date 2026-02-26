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
    font-size: 16px;
    width: 80mm;
    padding: 6mm;
    color: #000;
    background: #fff;
    line-height: 1.4;
  }
  .header { text-align: center; margin-bottom: 10px; }
  .header .brand { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
  .line { border-top: 1px dashed #000; margin: 8px 0; }
  .double-line { border-top: 3px double #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .items { font-size: 14px; margin: 8px 0; }
  .items .item { display: flex; justify-content: space-between; margin: 4px 0; }
  .items .item .desc { flex: 1; margin: 0 8px; }
  .totals { margin-top: 10px; }
  .totals .row { margin: 2px 0; }
  .grand-total {
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    margin: 10px 0;
    border-top: 3px double #000;
    border-bottom: 3px double #000;
    padding: 5px 0;
  }
  .footer { text-align: center; margin-top: 12px; font-size: 14px; line-height: 1.5; }
  @media print {
    body { width: 80mm; padding: 6mm; }
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
  <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin:8px 0;">
    <span>CANT</span><span style="flex:1;margin:0 8px">DESCRIPCIÓN</span><span>IMPORTE</span>
  </div>
  <div class="line"></div>

  <div class="items">
    ${data.items.map(item => `
      <div class="item">
        <span>${String(item.qty).padStart(2)}</span>
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

    // Use an invisible iframe to bypass popup blockers
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const win = iframe.contentWindow
    if (!win) {
      alert('Error al acceder al sistema de impresión. Por favor contacte soporte.')
      document.body.removeChild(iframe)
      return
    }

    win.document.open()
    win.document.write(html)
    win.document.close()

    // Wait 500ms to ensure the ticket logic (and possible logos) are loaded before printing
    setTimeout(() => {
      win.focus()
      win.print()

      // Cleanup iframe after printing dialog closes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 2000) // Delay to ensure print dialog triggers before removal
    }, 500)
  }
}
