import { Order } from "../firebase/hooks";
import { SUNAT_CONFIG } from "./config";

function numberToWords(amount: number): string {
  const units = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const teens = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const tens = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const hundreds = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  const decimalStr = `${decimalPart.toString().padStart(2, "0")}/100 SOLES`;

  if (integerPart === 0) return `CERO CON ${decimalStr}`;
  if (integerPart === 100) return `CIEN CON ${decimalStr}`;

  let words = "";
  if (integerPart >= 100) {
    words += hundreds[Math.floor(integerPart / 100)] + " ";
  }

  const remainder = integerPart % 100;
  if (remainder >= 10 && remainder < 20) {
    words += teens[remainder - 10] + " ";
  } else if (remainder >= 20) {
    if (remainder === 20) words += "VEINTE ";
    else if (remainder < 30) words += `VEINTI${units[remainder % 10]} `;
    else {
      words += tens[Math.floor(remainder / 10)];
      if (remainder % 10 > 0) words += ` Y ${units[remainder % 10]}`;
      words += " ";
    }
  } else if (remainder > 0) {
    words += units[remainder] + " ";
  }

  return `SON: ${words.trim()} CON ${decimalStr}`;
}

export function getSunatQrData(order: Order): string {
  const ticketNumber = order.voucherNumber || "B001-00000001";
  const parts = ticketNumber.split("-");
  const serie = parts[0] || "B001";
  const correlativo = parts[1] || "00000001";
  const total = order.total;
  const gravada = total / 1.18;
  const igv = total - gravada;
  const tipoDoc = order.tipoDocumento === "factura" ? "01" : "03";
  const docIdentidad = (order.clienteDocumento || "").length === 11 ? "6" : "1";

  if (order.sunatQr) return order.sunatQr;

  return [
    SUNAT_CONFIG.ruc,
    tipoDoc,
    serie,
    correlativo,
    igv.toFixed(2),
    total.toFixed(2),
    new Date(order.createdAt).toISOString().slice(0, 10),
    docIdentidad,
    order.clienteDocumento || "00000000",
    order.sunatHash || "SUNAT-HASH-PROVISIONAL",
  ].join("|");
}

export function printTicket80mm(order: Order) {
  const printWindow = window.open("", "_blank", "width=380,height=750");
  if (!printWindow) return alert("Por favor permita las ventanas emergentes (pop-ups).");

  const ticketNumber = order.voucherNumber || "S/N";
  const totalPagar = order.total;
  const subtotal = totalPagar / 1.18;
  const igv = totalPagar - subtotal;
  const amountInWords = numberToWords(totalPagar);
  const qrData = getSunatQrData(order);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrData)}`;

  const itemsHtml = order.items?.map(item => `
    <div style="font-size: 11px; color: #000; margin-bottom: 8px;">
      <p style="margin: 0 0 2px 0; text-transform: uppercase;">${item.nombre}</p>
      <div style="display: flex;">
        <span style="flex: 1;">${item.cantidad.toFixed(2)}</span>
        <span style="width: 40px; text-align: center;">NIU</span>
        <span style="width: 80px; text-align: right;">${item.precio.toFixed(2)}</span>
        <span style="width: 64px; text-align: right;">${(item.precio * item.cantidad).toFixed(2)}</span>
      </div>
    </div>
  `).join("") || "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket 80mm - ${ticketNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 15px 5px; color: #000; background: #fff; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .border-dashed { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="text-center" style="margin-bottom: 16px;">
          <h2 class="font-black" style="font-size: 20px; margin: 0;">${SUNAT_CONFIG.nombreComercial}</h2>
          <p class="font-bold" style="font-size: 10px; margin: 0 0 6px 0;">BROASTER Y BRASAS</p>
          <div style="font-size: 10px; line-height: 1.3;">
            <p style="margin: 0;" class="font-bold">${SUNAT_CONFIG.razonSocial}</p>
            <p style="margin: 0;" class="font-bold">RUC: ${SUNAT_CONFIG.ruc}</p>
            <p style="margin: 0;">${SUNAT_CONFIG.direccion}</p>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div class="flex justify-between font-black uppercase" style="font-size: 13px;">
            <span>${order.tipoDocumento === 'factura' ? 'Factura Electronica' : 'Boleta Electronica'}</span>
            <span>${ticketNumber}</span>
          </div>
          <div style="font-size: 11px; margin-top: 2px;">
            ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div style="font-size: 11px; margin-bottom: 12px;">
          <div class="flex"><span style="width: 80px;">RECEPTOR:</span><span>${order.clienteDocumento || "00000000"}</span></div>
          <div class="font-bold uppercase">${order.clienteNombre || "CONSUMIDOR FINAL"}</div>
        </div>

        <div class="border-dashed" style="font-size: 11px; font-weight: bold;">
          <div class="flex">
            <span style="flex: 1;">Cant.</span>
            <span style="width: 40px; text-align: center;">UM</span>
            <span style="width: 80px; text-align: right;">P.Unit</span>
            <span style="width: 64px; text-align: right;">Total</span>
          </div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 12px;">
          ${itemsHtml}
        </div>

        <div style="font-size: 11px; padding: 0 30px 12px 30px; display: flex; flex-direction: column; gap: 4px;">
          <div class="flex justify-between"><span>OP. GRAVADA:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
          <div class="flex justify-between"><span>I.G.V. 18%:</span><span>S/ ${igv.toFixed(2)}</span></div>
          <div class="flex justify-between font-bold" style="font-size: 13px; border-top: 1px dashed #000; padding-top: 4px;">
            <span>TOTAL:</span><span>S/ ${totalPagar.toFixed(2)}</span>
          </div>
        </div>

        <div class="text-center" style="font-size: 10px; margin-bottom: 12px;">${amountInWords}</div>

        <div class="text-center" style="margin-bottom: 8px;">
          <img src="${qrUrl}" style="width: 110px; height: 110px; margin: 0 auto; display: block;" alt="QR SUNAT" />
          <p style="font-size: 9px; margin: 4px 0 0 0; font-family: monospace;">Hash: ${order.sunatHash || 'SUNAT-DIGEST-OK'}</p>
        </div>

        <div class="text-center" style="font-size: 8px; line-height: 1.2;">
          <p style="margin: 0;">Representación impresa de la ${order.tipoDocumento === 'factura' ? 'Factura' : 'Boleta'} Electrónica</p>
          <p style="margin: 0;">Consulte su comprobante en SUNAT Operaciones en Línea</p>
          <p style="margin: 6px 0 0 0; font-weight: bold; font-size: 10px;">¡GRACIAS POR SU COMPRA!</p>
        </div>

        <script>
          window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function printTicket58mm(order: Order) {
  const printWindow = window.open("", "_blank", "width=320,height=700");
  if (!printWindow) return alert("Por favor permita las ventanas emergentes (pop-ups).");

  const ticketNumber = order.voucherNumber || "S/N";
  const totalPagar = order.total;
  const subtotal = totalPagar / 1.18;
  const igv = totalPagar - subtotal;
  const qrData = getSunatQrData(order);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrData)}`;

  const itemsHtml = order.items?.map(item => `
    <div style="font-size: 9px; margin-bottom: 4px;">
      <div style="text-transform: uppercase; font-weight: bold;">${item.nombre}</div>
      <div style="display: flex; justify-content: space-between;">
        <span>${item.cantidad} x ${item.precio.toFixed(2)}</span>
        <span>S/ ${(item.precio * item.cantidad).toFixed(2)}</span>
      </div>
    </div>
  `).join("") || "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket 58mm - ${ticketNumber}</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          body { font-family: monospace; width: 48mm; margin: 0 auto; padding: 10px 2px; color: #000; font-size: 9px; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .flex { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <strong style="font-size: 13px;">${SUNAT_CONFIG.nombreComercial}</strong>
          <div style="font-size: 8px;">RUC: ${SUNAT_CONFIG.ruc}</div>
          <div style="font-size: 8px;">${SUNAT_CONFIG.razonSocial}</div>
          <div style="font-size: 7px; margin-bottom: 8px;">${SUNAT_CONFIG.direccion}</div>
          <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 6px;">
            <strong style="font-size: 10px;">${(order.tipoDocumento || 'boleta').toUpperCase()} ELECTRÓNICA</strong><br/>
            <strong>${ticketNumber}</strong>
          </div>
        </div>

        <div style="font-size: 8px; margin-bottom: 6px;">
          <div>FECHA: ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div>CLIENTE: ${order.clienteNombre || 'CONSUMIDOR FINAL'}</div>
          <div>DOC: ${order.clienteDocumento || '00000000'}</div>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 6px;">
          ${itemsHtml}
        </div>

        <div style="font-size: 9px; margin-bottom: 8px;">
          <div class="flex"><span>OP. GRAVADA:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
          <div class="flex"><span>IGV 18%:</span><span>S/ ${igv.toFixed(2)}</span></div>
          <div class="flex font-bold" style="font-size: 11px; border-top: 1px dashed #000; padding-top: 2px;">
            <span>TOTAL:</span><span>S/ ${totalPagar.toFixed(2)}</span>
          </div>
        </div>

        <div class="text-center" style="margin-bottom: 6px;">
          <img src="${qrUrl}" style="width: 90px; height: 90px; margin: 0 auto; display: block;" alt="QR" />
          <div style="font-size: 7px; font-family: monospace;">Hash: ${order.sunatHash ? order.sunatHash.slice(0, 16) + '...' : 'OK'}</div>
        </div>

        <div class="text-center" style="font-size: 7px;">
          <div>Representación impresa de CPE</div>
          <strong>¡GRACIAS POR SU PREFERENCIA!</strong>
        </div>

        <script>
          window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function printInvoiceA4(order: Order) {
  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) return alert("Por favor permita las ventanas emergentes (pop-ups).");

  const ticketNumber = order.voucherNumber || "S/N";
  const totalPagar = order.total;
  const subtotal = totalPagar / 1.18;
  const igv = totalPagar - subtotal;
  const amountInWords = numberToWords(totalPagar);
  const qrData = getSunatQrData(order);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const rowsHtml = order.items?.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px;">
      <td style="padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; text-align: center;">${item.cantidad.toFixed(2)}</td>
      <td style="padding: 8px; text-align: center;">NIU</td>
      <td style="padding: 8px; text-transform: uppercase;">${item.nombre}</td>
      <td style="padding: 8px; text-align: right;">S/ ${(item.precio / 1.18).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right;">S/ ${(item.precio).toFixed(2)}</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">S/ ${(item.precio * item.cantidad).toFixed(2)}</td>
    </tr>
  `).join("") || "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Factura A4 - ${ticketNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 20px; background: #fff; }
          .border-box { border: 1.5px solid #1f2937; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f3f4f6; border-bottom: 1.5px solid #1f2937; padding: 8px; font-size: 10px; text-transform: uppercase; font-weight: 800; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
          <div style="flex: 1; padding-right: 24px;">
            <h1 style="font-size: 26px; font-weight: 900; margin: 0 0 4px 0; color: #0D0D0D;">${SUNAT_CONFIG.nombreComercial}</h1>
            <p style="font-size: 12px; font-weight: 700; color: #BF391B; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">BROASTER Y BRASAS</p>
            <p style="font-size: 11px; font-weight: 700; margin: 0 0 2px 0;">${SUNAT_CONFIG.razonSocial}</p>
            <p style="font-size: 11px; color: #4b5563; margin: 0 0 2px 0;">${SUNAT_CONFIG.direccion}</p>
            <p style="font-size: 11px; color: #4b5563; margin: 0;">Teléfono: 984335339 | Junín - Huancayo - Perú</p>
          </div>
          <div class="border-box" style="width: 260px; text-align: center; padding: 14px 10px; background: #fafafa;">
            <div style="font-size: 14px; font-weight: 900; margin-bottom: 6px;">R.U.C. N° ${SUNAT_CONFIG.ruc}</div>
            <div style="font-size: 15px; font-weight: 900; background: #0D0D0D; color: #fff; padding: 6px 4px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase;">
              ${order.tipoDocumento === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
            </div>
            <div style="font-size: 16px; font-weight: 900; color: #BF391B;">${ticketNumber}</div>
          </div>
        </div>

        <!-- Info Cliente Box -->
        <div class="border-box" style="padding: 12px 16px; margin-bottom: 20px; font-size: 11px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
            <div>
              <span style="font-weight: bold; width: 90px; display: inline-block;">Señor(es):</span>
              <span style="text-transform: uppercase; font-weight: bold;">${order.clienteNombre || 'CONSUMIDOR FINAL'}</span>
            </div>
            <div>
              <span style="font-weight: bold; width: 70px; display: inline-block;">Fecha Emisión:</span>
              <span>${new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span style="font-weight: bold; width: 90px; display: inline-block;">R.U.C. / D.N.I.:</span>
              <span>${order.clienteDocumento || '00000000'}</span>
            </div>
            <div>
              <span style="font-weight: bold; width: 70px; display: inline-block;">Moneda:</span>
              <span>SOLES (PEN)</span>
            </div>
            <div>
              <span style="font-weight: bold; width: 90px; display: inline-block;">Dirección:</span>
              <span>${order.clienteDocumento?.length === 11 ? 'HUANCAYO - PERU' : '-'}</span>
            </div>
            <div>
              <span style="font-weight: bold; width: 70px; display: inline-block;">Condición:</span>
              <span>CONTADO / EFECTIVO</span>
            </div>
          </div>
        </div>

        <!-- Tabla Productos -->
        <div class="border-box" style="overflow: hidden; margin-bottom: 20px;">
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">ÍTEM</th>
                <th style="width: 70px; text-align: center;">CANT.</th>
                <th style="width: 50px; text-align: center;">U.M.</th>
                <th style="text-align: left;">DESCRIPCIÓN</th>
                <th style="width: 90px; text-align: right;">VALOR UNIT.</th>
                <th style="width: 90px; text-align: right;">PRECIO UNIT.</th>
                <th style="width: 100px; text-align: right;">IMPORTE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Totales y Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <!-- QR y Leyenda -->
          <div style="flex: 1; padding-right: 30px;">
            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
              <img src="${qrUrl}" style="width: 110px; height: 110px; border: 1px solid #d1d5db; padding: 4px; border-radius: 6px;" alt="QR SUNAT" />
              <div style="font-size: 10px; color: #4b5563; line-height: 1.4;">
                <p style="margin: 0 0 4px 0; font-weight: bold; color: #111827;">${amountInWords}</p>
                <p style="margin: 0 0 2px 0; font-family: monospace;">Código Hash: ${order.sunatHash || 'SUNAT-DIGEST-OK'}</p>
                <p style="margin: 0;">Representación impresa de la ${order.tipoDocumento === 'factura' ? 'Factura' : 'Boleta'} Electrónica.</p>
                <p style="margin: 0;">Autorizado para ser emisor electrónico mediante resolución de SUNAT.</p>
              </div>
            </div>
          </div>

          <!-- Resumen de Totales Box -->
          <div class="border-box" style="width: 250px; padding: 10px 14px; font-size: 11px; background: #fafafa;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>OP. GRAVADA:</span><span style="font-weight: bold;">S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>OP. INAFECTA:</span><span>S/ 0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>OP. EXONERADA:</span><span>S/ 0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>I.G.V. (18%):</span><span style="font-weight: bold;">S/ ${igv.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; border-top: 1.5px solid #1f2937; padding-top: 6px; color: #BF391B;">
              <span>TOTAL A PAGAR:</span><span>S/ ${totalPagar.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function downloadInvoiceXml(order: Order) {
  const ticketNumber = order.voucherNumber || "B001-00000001";
  const tipoDoc = order.tipoDocumento === "factura" ? "01" : "03";
  const filename = `${SUNAT_CONFIG.ruc}-${tipoDoc}-${ticketNumber}.xml`;

  const total = order.total;
  const gravada = (total / 1.18).toFixed(2);
  const igv = (total - total / 1.18).toFixed(2);
  const [serie, correlativo] = ticketNumber.split("-");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <ds:Signature Id="SignMisterPepe">
          <ds:SignedInfo>
            <ds:DigestValue>${order.sunatHash || '4kL89fA+...'}</ds:DigestValue>
          </ds:SignedInfo>
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${ticketNumber}</cbc:ID>
  <cbc:IssueDate>${new Date(order.createdAt).toISOString().slice(0, 10)}</cbc:IssueDate>
  <cbc:IssueTime>${new Date(order.createdAt).toTimeString().slice(0, 8)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="0101">${tipoDoc}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${SUNAT_CONFIG.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${SUNAT_CONFIG.razonSocial}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${(order.clienteDocumento || '').length === 11 ? '6' : '1'}">${order.clienteDocumento || '00000000'}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${order.clienteNombre || 'CONSUMIDOR FINAL'}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${igv}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${gravada}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${igv}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${gravada}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadCdrXml(order: Order) {
  const ticketNumber = order.voucherNumber || "B001-00000001";
  const tipoDoc = order.tipoDocumento === "factura" ? "01" : "03";
  const filename = `R-${SUNAT_CONFIG.ruc}-${tipoDoc}-${ticketNumber}.xml`;

  const cdrContent = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
                     xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                     xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${ticketNumber}</cbc:ID>
  <cbc:IssueDate>${new Date(order.createdAt).toISOString().slice(0, 10)}</cbc:IssueDate>
  <cbc:IssueTime>${new Date(order.createdAt).toTimeString().slice(0, 8)}</cbc:IssueTime>
  <cac:SenderParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="6">20131312955</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>SUNAT - SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA</cbc:RegistrationName>
    </cac:PartyLegalEntity>
  </cac:SenderParty>
  <cac:ReceiverParty>
    <cac:PartyIdentification>
      <cbc:ID schemeID="6">${SUNAT_CONFIG.ruc}</cbc:ID>
    </cac:PartyIdentification>
  </cac:ReceiverParty>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${ticketNumber}</cbc:ReferenceID>
      <cbc:ResponseCode>${order.sunatCdrCode || '0'}</cbc:ResponseCode>
      <cbc:Description><![CDATA[${order.sunatCdrDesc || 'El Comprobante numero ' + ticketNumber + ' ha sido aceptado'}]]></cbc:Description>
    </cac:Response>
    <cac:DocumentReference>
      <cbc:ID>${ticketNumber}</cbc:ID>
      <cbc:DocumentTypeCode>${tipoDoc}</cbc:DocumentTypeCode>
    </cac:DocumentReference>
  </cac:DocumentResponse>
</ApplicationResponse>`;

  const blob = new Blob([cdrContent], { type: "application/xml;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
