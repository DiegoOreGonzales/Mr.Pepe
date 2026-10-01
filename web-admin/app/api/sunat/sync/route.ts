import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { processElectronicInvoice } from "@/lib/sunat/sunat-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId;
    const orderIds = body.orderIds;

    let targetOrders = [];

    if (orderId) {
      // Reintentar o sincronizar un pedido específico
      const res = await query("SELECT * FROM orders WHERE id = $1 AND sunat_status != 'ACEPTADO'", [orderId]);
      targetOrders = res.rows;
    } else if (Array.isArray(orderIds) && orderIds.length > 0) {
      // Sincronizar pedidos seleccionados manualmente
      const res = await query(
        "SELECT * FROM orders WHERE id = ANY($1::uuid[]) AND sunat_status = 'PENDIENTE' ORDER BY created_at ASC",
        [orderIds]
      );
      targetOrders = res.rows;
    } else {
      // Sincronizar comprobantes pendientes de pago (excluye HISTORICO / EXCLUIDO)
      const res = await query(
        "SELECT * FROM orders WHERE status = 'pagado' AND sunat_status = 'PENDIENTE' ORDER BY created_at ASC LIMIT 50"
      );
      targetOrders = res.rows;
    }

    if (targetOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay comprobantes pendientes de envío",
        processed: 0,
      });
    }

    const results = [];

    for (const ord of targetOrders) {
      const items = Array.isArray(ord.items) ? ord.items : JSON.parse(ord.items || "[]");
      const tipoDoc = ord.tipo_documento === "factura" ? "factura" : "boleta";

      // Proteger contra Error 2324 de SUNAT (comprobantes emitidos con más de 3 días de antigüedad)
      const orderDate = new Date(ord.created_at);
      const diffDays = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      const fechaEmision = diffDays > 3 ? new Date() : orderDate;

      const sunatRes = await processElectronicInvoice({
        voucherNumber: ord.voucher_number,
        tipoDocumento: tipoDoc,
        clienteNombre: ord.cliente_nombre || "Consumidor Final",
        clienteDocumento: ord.cliente_documento || "00000000",
        items,
        total: Number(ord.total),
        fecha: fechaEmision,
      });

      await query(
        `UPDATE orders 
         SET sunat_status = $1, sunat_hash = $2, sunat_qr = $3, sunat_cdr_code = $4, sunat_cdr_desc = $5,
             created_at = CASE WHEN $7::boolean = true THEN CURRENT_TIMESTAMP ELSE created_at END
         WHERE id = $6`,
        [
          sunatRes.status,
          sunatRes.hash,
          sunatRes.qrString,
          sunatRes.cdrCode ? String(sunatRes.cdrCode).substring(0, 10) : null,
          sunatRes.cdrDesc || null,
          ord.id,
          diffDays > 3,
        ]
      );

      results.push({
        id: ord.id,
        voucherNumber: ord.voucher_number,
        status: sunatRes.status,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Se procesaron ${results.length} comprobantes`,
      results,
    });
  } catch (error: any) {
    console.error("Error al sincronizar con SUNAT:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
