import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { processElectronicInvoice } from "@/lib/sunat/sunat-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId;

    let targetOrders = [];

    if (orderId) {
      // Reintentar un pedido específico
      const res = await query("SELECT * FROM orders WHERE id = $1", [orderId]);
      targetOrders = res.rows;
    } else {
      // Reintentar todos los comprobantes pendientes de pago
      const res = await query(
        "SELECT * FROM orders WHERE status = 'pagado' AND sunat_status = 'PENDIENTE' ORDER BY created_at ASC LIMIT 20"
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

      const sunatRes = await processElectronicInvoice({
        voucherNumber: ord.voucher_number,
        tipoDocumento: tipoDoc,
        clienteNombre: ord.cliente_nombre || "Consumidor Final",
        clienteDocumento: ord.cliente_documento || "00000000",
        items,
        total: Number(ord.total),
        fecha: ord.created_at,
      });

      await query(
        `UPDATE orders 
         SET sunat_status = $1, sunat_hash = $2, sunat_qr = $3, sunat_cdr_code = $4, sunat_cdr_desc = $5 
         WHERE id = $6`,
        [
          sunatRes.status,
          sunatRes.hash,
          sunatRes.qrString,
          sunatRes.cdrCode || null,
          sunatRes.cdrDesc || null,
          ord.id,
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
