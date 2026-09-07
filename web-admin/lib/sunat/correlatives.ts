import { query } from "@/lib/db";
import { SUNAT_CONFIG } from "./config";

/**
 * Obtiene el siguiente correlativo consecutivo oficial para una Boleta o Factura.
 * Formato SUNAT: B001-00000001 o F001-00000001 (Serie 4 caracteres - Correlativo 8 dígitos)
 */
export async function getNextCorrelative(tipoDocumento: "boleta" | "factura"): Promise<string> {
  const serie = tipoDocumento === "factura" ? SUNAT_CONFIG.series.factura : SUNAT_CONFIG.series.boleta;
  const prefix = `${serie}-`;

  try {
    // Buscar el último número registrado para esta serie
    const res = await query(
      `SELECT voucher_number FROM orders 
       WHERE voucher_number LIKE $1 
       ORDER BY created_at DESC, voucher_number DESC 
       LIMIT 50`,
      [`${prefix}%`]
    );

    let maxNum = 0;
    for (const row of res.rows) {
      if (row.voucher_number && row.voucher_number.startsWith(prefix)) {
        const part = row.voucher_number.replace(prefix, "").trim();
        const parsed = parseInt(part, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    const nextNum = maxNum + 1;
    const formattedCorrelative = String(nextNum).padStart(8, "0");
    return `${serie}-${formattedCorrelative}`;
  } catch (error) {
    console.error("Error al obtener siguiente correlativo SUNAT:", error);
    // Fallback de contingencia con timestamp en caso de error de BD
    const fallbackNum = Date.now().toString().slice(-8);
    return `${serie}-${fallbackNum}`;
  }
}
