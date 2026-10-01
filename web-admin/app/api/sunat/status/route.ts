import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { SUNAT_CONFIG } from "@/lib/sunat/config";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const certCandidates = [
      path.resolve(process.cwd(), "certs", "certificate.pem"),
      path.resolve(process.cwd(), "web-admin", "certs", "certificate.pem"),
      path.resolve(__dirname, "..", "..", "..", "..", "certs", "certificate.pem"),
    ];
    const certExists = certCandidates.some((p) => fs.existsSync(p));

    return NextResponse.json({
      success: true,
      config: {
        modo: SUNAT_CONFIG.modo,
        ambiente: SUNAT_CONFIG.ambiente,
        ruc: SUNAT_CONFIG.ruc,
        razonSocial: SUNAT_CONFIG.razonSocial,
        certificadoCargado: certExists,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, orderIds, status } = body;

    const allowedStatuses = ["PENDIENTE", "HISTORICO", "EXCLUIDO", "ACEPTADO"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Estado inválido. Debe ser uno de: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    if (orderId) {
      const res = await query(
        "UPDATE orders SET sunat_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
        [status, orderId]
      );
      updatedCount = res.rowCount || 0;
    } else if (Array.isArray(orderIds) && orderIds.length > 0) {
      const res = await query(
        "UPDATE orders SET sunat_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::uuid[]) RETURNING id",
        [status, orderIds]
      );
      updatedCount = res.rowCount || 0;
    } else {
      return NextResponse.json(
        { success: false, error: "Se requiere orderId o un array de orderIds" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} comprobante(s) actualizado(s) a estado ${status}`,
      updated: updatedCount,
      status,
    });
  } catch (error: any) {
    console.error("Error al actualizar estado SUNAT:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
