"use client";
import { useState, useRef, useCallback } from "react";
import { useBillingOrders, Order } from "@/lib/firebase/hooks";
import { numberToWords } from "@/lib/numberToWords";
import { printTicket80mm, printTicket58mm, printInvoiceA4, downloadInvoiceXml, downloadCdrXml } from "@/lib/sunat/print-formats";

// ── API RENIEC - Consulta DNI (via /api/reniec proxy) ─────────────────────────

interface DniResult {
  nombres: string;
  apellidos: string;
  verified: boolean;
}

function DniLookup() {
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DniResult | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((type: "success" | "error" | "warning", message: string) => {
    setToast({ type, message });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const handleDniChange = async (value: string) => {
    // Solo permitir números
    const cleaned = value.replace(/\D/g, "").slice(0, 8);
    setDni(cleaned);

    if (cleaned.length === 8) {
      setLoading(true);
      setNombres("Buscando...");
      setApellidos("Buscando...");

      try {
        const response = await fetch(`/api/reniec?dni=${cleaned}`);
        const data = await response.json();

        if (!data.success) {
          showToast("error", data.error || "DNI no encontrado en RENIEC");
          setNombres("");
          setApellidos("");
          setReadOnly(false);
          setResult(null);
        } else {
          const info = data.data;
          setNombres(info.nombres);
          setApellidos(`${info.apellidoPaterno} ${info.apellidoMaterno}`);
          setReadOnly(true);
          setResult({
            nombres: info.nombres,
            apellidos: `${info.apellidoPaterno} ${info.apellidoMaterno}`,
            verified: true,
          });
          showToast("success", "¡Identidad Verificada con RENIEC!");
        }
      } catch {
        showToast("warning", "No se pudo conectar con RENIEC. Ingrese manualmente.");
        setReadOnly(false);
        setNombres("");
        setApellidos("");
        setResult(null);
      } finally {
        setLoading(false);
      }

    } else {
      // Reset si cambia el DNI
      if (result) {
        setResult(null);
        setNombres("");
        setApellidos("");
        setReadOnly(false);
      }
    }
  };

  const handleClear = () => {
    setDni("");
    setNombres("");
    setApellidos("");
    setReadOnly(false);
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow p-6 no-print animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all animate-fade-in ${
            toast.type === "success"
              ? "bg-[#1A8952] text-white"
              : toast.type === "error"
              ? "bg-[#BF391B] text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "verified" : toast.type === "error" ? "error" : "warning"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#BF391B]/10">
            <span className="material-symbols-outlined text-[#BF391B] text-[22px]">badge</span>
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#0D0D0D]">Consulta DNI — RENIEC</h3>
            <p className="text-[11px] text-[#9AA0A6] font-medium">Ingrese 8 dígitos para autocompletar datos del cliente</p>
          </div>
        </div>
        {result?.verified && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A8952]/10 text-[#1A8952] text-[10px] font-extrabold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Verificado
          </span>
        )}
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DNI Input */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-2">
            N° DNI
          </label>
          <div className="relative">
            <input
              type="text"
              value={dni}
              onChange={(e) => handleDniChange(e.target.value)}
              placeholder="Ej: 70123456"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:border-[#BF391B] focus:ring-2 focus:ring-[#BF391B]/10 transition-all bg-white text-sm font-bold text-[#0D0D0D] placeholder:text-stone-300 pr-12"
            />
            {/* Loader */}
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-[#BF391B]/30 border-t-[#BF391B] rounded-full animate-spin" />
              </div>
            )}
            {/* Clear button */}
            {!loading && dni.length > 0 && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#BF391B] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(dni.length / 8) * 100}%`,
                background: dni.length === 8 ? (result?.verified ? "#1A8952" : "#BF391B") : "#BF391B",
              }}
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-1">{dni.length}/8 dígitos</p>
        </div>

        {/* Nombres */}
        <div>
          <label className="block text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-2">
            Nombres
          </label>
          <input
            type="text"
            value={nombres}
            onChange={(e) => !readOnly && setNombres(e.target.value)}
            readOnly={readOnly}
            placeholder="Se autocompleta..."
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-medium ${
              readOnly
                ? "bg-[#1A8952]/5 border-[#1A8952]/30 text-[#0D0D0D] cursor-default"
                : "bg-white border-stone-200 focus:border-[#BF391B] focus:ring-2 focus:ring-[#BF391B]/10 text-[#0D0D0D] placeholder:text-stone-300"
            }`}
          />
        </div>

        {/* Apellidos */}
        <div>
          <label className="block text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-2">
            Apellidos
          </label>
          <input
            type="text"
            value={apellidos}
            onChange={(e) => !readOnly && setApellidos(e.target.value)}
            readOnly={readOnly}
            placeholder="Se autocompleta..."
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-medium ${
              readOnly
                ? "bg-[#1A8952]/5 border-[#1A8952]/30 text-[#0D0D0D] cursor-default"
                : "bg-white border-stone-200 focus:border-[#BF391B] focus:ring-2 focus:ring-[#BF391B]/10 text-[#0D0D0D] placeholder:text-stone-300"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function printBillingTicket(order: Order) {
  const printWindow = window.open("", "_blank", "width=350,height=700");
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes (pop-ups) para poder imprimir.");
    return;
  }

  const ticketNumber = order.voucherNumber || "S/N";
  const totalPagar = order.total;
  const subtotal = totalPagar / 1.18;
  const igv = totalPagar - subtotal;
  const amountInWords = numberToWords(totalPagar);

  const qrData = order.sunatQr || [
    "10418236103",
    order.tipoDocumento === "factura" ? "01" : "03",
    ticketNumber.split("-")[0] || "B001",
    ticketNumber.split("-")[1] || "00000001",
    igv.toFixed(2),
    totalPagar.toFixed(2),
    new Date(order.createdAt).toISOString().slice(0, 10),
    (order.clienteDocumento || "").length === 11 ? "6" : "1",
    order.clienteDocumento || "00000000",
    order.sunatHash || "SUNAT-PROVISIONAL",
  ].join("|");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrData)}`;

  const itemsHtml = order.items?.map(item => `
    <div style="font-size: 11px; color: #000; margin-bottom: 12px;">
      <p style="margin: 0 0 4px 0; text-transform: uppercase;">${item.nombre}</p>
      <div style="display: flex;">
        <span style="flex: 1;">${item.cantidad.toFixed(2)}</span>
        <span style="width: 40px; text-align: center;">UN</span>
        <span style="width: 80px; text-align: right;">${item.precio.toFixed(2)}</span>
        <span style="width: 64px; text-align: right;">${(item.precio * item.cantidad).toFixed(2)}</span>
      </div>
    </div>
  `).join("") || "";

  const html = `
    <html>
      <head>
        <title>Ticket - ${ticketNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 15px 5px;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          * {
            color: #000 !important;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .text-13 { font-size: 13px; }
          .text-11 { font-size: 11px; }
          .text-9 { font-size: 9px; }
          .uppercase { text-transform: uppercase; }
          .border-dashed { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="text-center" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: center; margin-bottom: 12px;">
            <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; padding: 4px;">
              <img src="${window.location.origin}/logo.png" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />
            </div>
          </div>
          <h2 class="font-black" style="font-size: 20px; letter-spacing: -0.5px; margin: 0;">MISTER PEPE II</h2>
          <p class="font-bold uppercase" style="font-size: 10px; letter-spacing: 0.2em; margin: 0 0 8px 0;">BROASTER Y BRASAS</p>
          
          <div style="font-size: 10px; line-height: 1.3;">
            <p style="margin: 0;" class="font-bold">DE LA CRUZ BALDEON ROCIO ELENA</p>
            <p style="margin: 0;" class="font-bold">RUC: 10418236103</p>
            <p style="margin: 0;" class="font-bold">CEL: 984335339</p>
            <p style="margin: 0;">Jr. Junín 413 con Av. 13 de Noviembre - El Tambo - Huancayo</p>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div class="flex justify-between font-black uppercase text-13" style="align-items: center; letter-spacing: 1px;">
            <span>${order.tipoDocumento === 'factura' ? 'Factura Electronica' : 'Boleta Electronica'}</span>
            <span>${ticketNumber}</span>
          </div>
          <div class="text-11" style="margin-top: 4px;">
            ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div class="text-11" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
          <div class="flex" style="gap: 8px;">
            <span style="width: 80px;">COMPRADOR</span>
            <span>${order.clienteDocumento || "00000000"}</span>
          </div>
          <div class="font-bold uppercase">${order.clienteNombre || "CONSUMIDOR FINAL"}</div>
        </div>

        <div class="text-11" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;">
          <div class="flex" style="gap: 8px;">
            <span class="font-bold" style="width: 96px;">Metodo de pago:</span>
            <span>Efectivo</span>
          </div>
          <div class="flex" style="gap: 8px;">
            <span class="font-bold" style="width: 96px;">Forma de pago:</span>
            <span>Contado</span>
          </div>
          <div class="flex" style="gap: 8px;">
            <span class="font-bold" style="width: 96px;">F.Vencimiento:</span>
            <span>${new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="border-dashed">
          <p class="text-11 font-bold" style="margin: 0 0 8px 0;">Descripción</p>
          <div class="flex text-11 font-bold" style="margin-bottom: 4px;">
            <span style="flex: 1;">Cantidad</span>
            <span style="width: 40px; text-align: center;">UM</span>
            <span style="width: 80px; text-align: right;">P. Unitario</span>
            <span style="width: 64px; text-align: right;">Total</span>
          </div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 16px;">
          ${itemsHtml}
        </div>

        <div class="text-11" style="padding-left: 40px; display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;">
          <div class="flex justify-between font-bold text-13">
            <span>IMPORTE</span>
            <span>S/ ${totalPagar.toFixed(2)}</span>
          </div>
          <div class="flex justify-between font-bold text-13">
            <span>DESCUENTO</span>
            <span>S/ 0.00</span>
          </div>
          <div class="flex justify-between font-bold text-13">
            <span>OP. GRATUITAS</span>
            <span>S/ 0.00</span>
          </div>
          <div class="flex justify-between font-bold text-13">
            <span>ICBPER</span>
            <span>S/ 0.00</span>
          </div>
          <div class="flex justify-between font-bold text-13">
            <span>IMPORTE TOTAL</span>
            <span>S/ ${totalPagar.toFixed(2)}</span>
          </div>
        </div>

        <div class="text-center text-11" style="margin-bottom: 16px;">
          ${amountInWords}
        </div>

        <div class="text-11" style="padding: 0 40px; display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px;">
          <div class="flex justify-between">
            <span>OP. GRAVADA:</span>
            <span>S/ ${subtotal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>I.G.V. 18%:</span>
            <span>S/ ${igv.toFixed(2)}</span>
          </div>
        </div>

        <div class="text-center" style="margin-top: 16px; margin-bottom: 12px;">
          <img src="${qrUrl}" style="width: 120px; height: 120px; margin: 0 auto; display: block;" alt="Código QR SUNAT" />
          <p class="text-9" style="margin: 6px 0 0 0; font-family: monospace; font-size: 9px;">Código Hash: ${order.sunatHash || 'SUNAT-DIGEST-OK'}</p>
        </div>

        <div class="text-center text-9" style="margin-bottom: 16px; line-height: 1.3; font-size: 8px;">
          <p style="margin: 0; font-weight: bold;">Representación impresa de la ${order.tipoDocumento === 'factura' ? 'Factura' : 'Boleta'} Electrónica</p>
          <p style="margin: 0;">Consulte su comprobante en SUNAT Operaciones en Línea</p>
        </div>

        <div class="text-center" style="margin-top: 8px; margin-bottom: 20px;">
          <p class="text-11 font-bold" style="margin: 0;">¡GRACIAS POR SU PREFERENCIA!</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

function PrintTicket({ order }: { order: Order | null }) {
  return null;
}

export default function FacturacionPage() {
  const { orders, loading, refresh: refreshBilling } = useBillingOrders();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filtros de Estado y Monto
  const [statusFilter, setStatusFilter] = useState<"todos" | "PENDIENTE" | "ACEPTADO" | "HISTORICO">("todos");
  const [amountFilter, setAmountFilter] = useState<"all" | "min10" | "min20" | "min50" | "small15">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(false);

  // Edit / Delete State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDoc, setEditDoc] = useState("");
  const [editTipo, setEditTipo] = useState<"boleta" | "factura">("boleta");
  const [editVoucher, setEditVoucher] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editSunatStatus, setEditSunatStatus] = useState<"PENDIENTE" | "ACEPTADO" | "HISTORICO">("PENDIENTE");

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [syncingSunat, setSyncingSunat] = useState(false);
  const [printModalOrder, setPrintModalOrder] = useState<Order | null>(null);
  const [cdrModalOrder, setCdrModalOrder] = useState<Order | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Transmisión manual con SUNAT (individual, por IDs seleccionados o masivo)
  const handleSyncSunat = async (orderId?: string, orderIds?: string[]) => {
    setSyncingSunat(true);
    try {
      const res = await fetch("/api/sunat/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message || "Sincronización con SUNAT completada");
        setSelectedIds([]);
        setShowSyncConfirmModal(false);
        await refreshBilling();
      } else {
        showToast("error", data.error || "Error al sincronizar con SUNAT");
      }
    } catch (e) {
      showToast("error", "Error de conexión al sincronizar con SUNAT");
    } finally {
      setSyncingSunat(false);
    }
  };

  // Cambio manual de estado SUNAT (para excluir compras pequeñas o restaurar a pendiente)
  const handleUpdateStatus = async (orderIdOrIds: string | string[], newStatus: "PENDIENTE" | "HISTORICO" | "EXCLUIDO") => {
    setProcessingStatus(true);
    try {
      const isArray = Array.isArray(orderIdOrIds);
      const res = await fetch("/api/sunat/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isArray ? { orderIds: orderIdOrIds, status: newStatus } : { orderId: orderIdOrIds, status: newStatus }
        ),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message || `Estado actualizado a ${newStatus}`);
        if (isArray) setSelectedIds([]);
        await refreshBilling();
      } else {
        showToast("error", data.error || "Error al actualizar estado");
      }
    } catch (e) {
      showToast("error", "Error de conexión al actualizar estado");
    } finally {
      setProcessingStatus(false);
    }
  };

  const handlePrint = (order: Order) => {
    printBillingTicket(order);
  };

  const openEditModal = (o: Order) => {
    setEditingOrder(o);
    setEditNombre(o.clienteNombre || "");
    setEditDoc(o.clienteDocumento || "");
    setEditTipo(o.tipoDocumento || "boleta");
    setEditVoucher(o.voucherNumber || "");
    setEditTotal(String(o.total));
    setEditSunatStatus((o.sunatStatus as any) || "PENDIENTE");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOrder.id,
          status: "pagado",
          clienteNombre: editNombre,
          clienteDocumento: editDoc,
          tipoDocumento: editTipo,
          voucherNumber: editVoucher,
          total: parseFloat(editTotal),
          sunatStatus: editSunatStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingOrder(null);
        showToast("success", "Comprobante editado correctamente");
        await refreshBilling();
      } else {
        showToast("error", "Error al editar: " + json.error);
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error de conexión al editar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este comprobante/boleta?")) return;

    try {
      const res = await fetch(`/api/orders?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Comprobante eliminado con éxito");
        await refreshBilling();
      } else {
        showToast("error", "Error al eliminar: " + json.error);
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error de conexión al eliminar");
    }
  };

  // Métricas para pestañas de estado
  const stats = {
    todos: {
      count: orders.length,
      total: orders.reduce((sum, o) => sum + o.total, 0),
    },
    pendiente: {
      count: orders.filter((o) => (o.sunatStatus || "PENDIENTE") === "PENDIENTE").length,
      total: orders
        .filter((o) => (o.sunatStatus || "PENDIENTE") === "PENDIENTE")
        .reduce((sum, o) => sum + o.total, 0),
    },
    aceptado: {
      count: orders.filter((o) => o.sunatStatus === "ACEPTADO").length,
      total: orders.filter((o) => o.sunatStatus === "ACEPTADO").reduce((sum, o) => sum + o.total, 0),
    },
    historico: {
      count: orders.filter((o) => o.sunatStatus === "HISTORICO" || o.sunatStatus === "EXCLUIDO").length,
      total: orders
        .filter((o) => o.sunatStatus === "HISTORICO" || o.sunatStatus === "EXCLUIDO")
        .reduce((sum, o) => sum + o.total, 0),
    },
  };

  // Filtrado compuesto
  const filtered = orders.filter((o) => {
    // 1. Búsqueda por texto
    const matchesSearch =
      search === "" ||
      o.clienteNombre?.toLowerCase().includes(search.toLowerCase()) ||
      o.clienteDocumento?.includes(search) ||
      o.voucherNumber?.toLowerCase().includes(search.toLowerCase());

    // 2. Filtro por Estado
    const st = o.sunatStatus || "PENDIENTE";
    let matchesStatus = true;
    if (statusFilter === "PENDIENTE") {
      matchesStatus = st === "PENDIENTE";
    } else if (statusFilter === "ACEPTADO") {
      matchesStatus = st === "ACEPTADO";
    } else if (statusFilter === "HISTORICO") {
      matchesStatus = st === "HISTORICO" || st === "EXCLUIDO";
    }

    // 3. Filtro por Monto (Compras pequeñas)
    let matchesAmount = true;
    if (amountFilter === "min10") matchesAmount = o.total >= 10;
    else if (amountFilter === "min20") matchesAmount = o.total >= 20;
    else if (amountFilter === "min50") matchesAmount = o.total >= 50;
    else if (amountFilter === "small15") matchesAmount = o.total <= 15;

    return matchesSearch && matchesStatus && matchesAmount;
  });

  // Manejo de Selección Múltiple
  const isAllSelected = filtered.length > 0 && filtered.every((o) => selectedIds.includes(o.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(filtered.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filtered.map((o) => o.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
  const selectedTotal = selectedOrders.reduce((sum, o) => sum + o.total, 0);
  const selectedPendientes = selectedOrders.filter((o) => (o.sunatStatus || "PENDIENTE") === "PENDIENTE");

  const handleExportCSV = () => {
    const headers = ["N° Comprobante", "Tipo Doc", "Cliente", "DNI / RUC", "Mesa", "Total (S/)", "Estado SUNAT", "Fecha y Hora"];
    const rows = filtered.map((o) => [
      o.voucherNumber || "S/N",
      (o.tipoDocumento || "boleta").toUpperCase(),
      o.clienteNombre || "Consumidor Final",
      o.clienteDocumento ? `="${o.clienteDocumento}"` : "00000000",
      `Mesa ${o.mesaNumero}`,
      o.total.toFixed(2),
      o.sunatStatus || "PENDIENTE",
      o.createdAt.toLocaleString("es-PE")
    ]);

    const csvContent = [
      ["sep=;"],
      ["MR. PEPE - FACTURACION Y BOLETAS"],
      ["REPORTE DE COMPROBANTES EMITIDOS CON GESTION DE ESTADO SUNAT"],
      [`Fecha de exportacion: ${new Date().toLocaleString("es-PE")}`],
      [], 
      headers,
      ...rows
    ].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `comprobantes_mrpepe_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold animate-fade-in ${
            toast.type === "success" ? "bg-[#1A8952] text-white" : "bg-[#BF391B] text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "verified" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Consulta DNI - RENIEC */}
      <div className="no-print">
        <DniLookup />
      </div>

      {/* Pestañas de Gestión de Estado SUNAT */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("todos")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "todos"
              ? "bg-stone-900 border-stone-900 text-white shadow-lg"
              : "bg-white border-stone-200 hover:border-stone-300 text-stone-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Todos</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              statusFilter === "todos" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
            }`}>
              {stats.todos.count}
            </span>
          </div>
          <div className="text-lg font-black mt-1">S/ {stats.todos.total.toFixed(2)}</div>
          <div className="text-[10px] opacity-75 mt-0.5">Historial total emitido</div>
        </button>

        <button
          onClick={() => setStatusFilter("PENDIENTE")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "PENDIENTE"
              ? "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/20"
              : "bg-amber-50/50 border-amber-200 hover:border-amber-300 text-amber-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusFilter === "PENDIENTE" ? "bg-white" : "bg-amber-500 animate-pulse"}`} />
              Pendientes
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              statusFilter === "PENDIENTE" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}>
              {stats.pendiente.count}
            </span>
          </div>
          <div className="text-lg font-black mt-1">S/ {stats.pendiente.total.toFixed(2)}</div>
          <div className="text-[10px] opacity-80 mt-0.5">Pendiente de envío manual</div>
        </button>

        <button
          onClick={() => setStatusFilter("ACEPTADO")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "ACEPTADO"
              ? "bg-green-700 border-green-700 text-white shadow-lg shadow-green-700/20"
              : "bg-green-50/50 border-green-200 hover:border-green-300 text-green-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Aceptados
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              statusFilter === "ACEPTADO" ? "bg-white/20 text-white" : "bg-green-100 text-green-800"
            }`}>
              {stats.aceptado.count}
            </span>
          </div>
          <div className="text-lg font-black mt-1">S/ {stats.aceptado.total.toFixed(2)}</div>
          <div className="text-[10px] opacity-80 mt-0.5">Declarados con éxito</div>
        </button>

        <button
          onClick={() => setStatusFilter("HISTORICO")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "HISTORICO"
              ? "bg-stone-700 border-stone-700 text-white shadow-lg"
              : "bg-stone-100/70 border-stone-200 hover:border-stone-300 text-stone-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">block</span>
              Excluidos / Histórico
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              statusFilter === "HISTORICO" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
            }`}>
              {stats.historico.count}
            </span>
          </div>
          <div className="text-lg font-black mt-1">S/ {stats.historico.total.toFixed(2)}</div>
          <div className="text-[10px] opacity-80 mt-0.5">No se envían a SUNAT</div>
        </button>
      </div>

      {/* Buscador y Controles de Filtro */}
      <div className="flex items-center gap-3 no-print flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-[320px] max-w-2xl">
          {/* Input Buscador */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] text-[20px]">search</span>
            <input
              type="text"
              placeholder="Buscar por DNI/RUC, Nombre o N° Comprobante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-[#BF391B] transition-all bg-white card-shadow text-sm"
            />
          </div>

          {/* Filtro de Compras Pequeñas (Evitar sobregiros) */}
          <div className="relative">
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value as any)}
              className="py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none focus:border-[#BF391B] card-shadow cursor-pointer"
              title="Filtro de montos para evitar sobregiro por compras pequeñas"
            >
              <option value="all">💰 Todos los montos</option>
              <option value="min10">💰 Monto ≥ S/ 10.00</option>
              <option value="min20">💰 Monto ≥ S/ 20.00</option>
              <option value="min50">💰 Monto ≥ S/ 50.00</option>
              <option value="small15">⚠️ Compras pequeñas (≤ S/ 15.00)</option>
            </select>
          </div>
        </div>
        
        {/* Botones de Acción Global */}
        <div className="flex items-center gap-2">
          {/* Botón Sincronizar SUNAT Manual */}
          <button
            onClick={() => setShowSyncConfirmModal(true)}
            disabled={syncingSunat || stats.pendiente.count === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-40"
            title="Enviar comprobantes pendientes a SUNAT manualmente"
          >
            <span className={`material-symbols-outlined text-[16px] ${syncingSunat ? 'animate-spin' : ''}`}>cloud_upload</span>
            {syncingSunat ? "Enviando..." : `Enviar Pendientes a SUNAT (${stats.pendiente.count})`}
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A8952] hover:bg-[#156E41] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-green-100"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Barra de Acciones en Lote (cuando hay ítems seleccionados) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-stone-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 no-print border border-stone-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 text-white font-mono text-xs font-bold">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold leading-tight">
                {selectedIds.length} comprobante(s) seleccionado(s)
              </p>
              <p className="text-[11px] text-stone-400 font-mono">
                Total acumulado: <strong className="text-white">S/ {selectedTotal.toFixed(2)}</strong> • ({selectedPendientes.length} pendientes)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Enviar seleccionadas a SUNAT */}
            {selectedPendientes.length > 0 && (
              <button
                onClick={() => handleSyncSunat(undefined, selectedPendientes.map(o => o.id))}
                disabled={syncingSunat}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-all shadow disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                Enviar {selectedPendientes.length} a SUNAT
              </button>
            )}

            {/* Excluir seleccionadas (Para compras pequeñas que no se quieren declarar) */}
            <button
              onClick={() => handleUpdateStatus(selectedIds, "HISTORICO")}
              disabled={processingStatus}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition-all border border-stone-700 disabled:opacity-50"
              title="Marcar como Histórico/Excluido para no enviar a SUNAT"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              Excluir de SUNAT ({selectedIds.length})
            </button>

            {/* Reactivar seleccionadas a PENDIENTE */}
            <button
              onClick={() => handleUpdateStatus(selectedIds, "PENDIENTE")}
              disabled={processingStatus}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition-all border border-stone-700 disabled:opacity-50"
              title="Restaurar estado a Pendiente para permitir envío"
            >
              <span className="material-symbols-outlined text-[16px]">restore</span>
              Poner en Pendiente
            </button>

            {/* Limpiar selección */}
            <button
              onClick={() => setSelectedIds([])}
              className="p-2 text-stone-400 hover:text-white transition-colors"
              title="Cancelar selección"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabla con Checkboxes y Gestión de Estado */}
      <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-stone-50">
            <tr className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest">
              <th className="px-4 py-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-stone-300 text-[#BF391B] focus:ring-[#BF391B] w-4 h-4 cursor-pointer"
                  title="Seleccionar todas las visibles"
                />
              </th>
              <th className="px-5 py-4">N° Comprobante</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Estado SUNAT</th>
              <th className="px-5 py-4">Fecha</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-6 py-4 animate-pulse bg-stone-50/50 h-16"></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-stone-400">
                  <span className="material-symbols-outlined text-[40px] mb-2 opacity-50">search_off</span>
                  <p className="text-sm font-bold">No se encontraron comprobantes con los filtros seleccionados</p>
                  <p className="text-xs text-stone-400 mt-1">Prueba cambiando la pestaña de estado o el filtro de monto.</p>
                </td>
              </tr>
            ) : filtered.map((o) => {
              const isSelected = selectedIds.includes(o.id);
              const orderStatus = o.sunatStatus || "PENDIENTE";
              const isSmallPurchase = o.total <= 15;

              return (
                <tr 
                  key={o.id} 
                  className={`hover:bg-stone-50 transition-colors group ${isSelected ? 'bg-amber-50/40' : ''}`}
                >
                  {/* Checkbox selección */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(o.id)}
                      className="rounded border-stone-300 text-[#BF391B] focus:ring-[#BF391B] w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* N° Comprobante */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#BF391B] text-xs">{o.voucherNumber || "S/N"}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 font-bold uppercase text-stone-600">
                        {o.tipoDocumento === 'factura' ? 'FAC' : 'BOL'}
                      </span>
                      {isSmallPurchase && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold" title="Compra pequeña">
                          ≤15
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-[#0D0D0D] uppercase truncate max-w-[200px]" title={o.clienteNombre || "Consumidor Final"}>
                      {o.clienteNombre || "Consumidor Final"}
                    </p>
                    <p className="text-[10px] text-[#9AA0A6]">{o.clienteDocumento || "Sin DNI"}</p>
                  </td>

                  {/* Estado SUNAT Badge */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setCdrModalOrder(o)}
                      className="group/badge inline-flex items-center gap-1.5 transition-transform hover:scale-105"
                      title="Ver Detalles y Constancia SUNAT"
                    >
                      {orderStatus === 'ACEPTADO' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          Aceptado
                          <span className="material-symbols-outlined text-[13px] opacity-60">verified</span>
                        </span>
                      )}

                      {orderStatus === 'PENDIENTE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pendiente Envío
                          <span className="material-symbols-outlined text-[13px] opacity-60">schedule</span>
                        </span>
                      )}

                      {(orderStatus === 'HISTORICO' || orderStatus === 'EXCLUIDO') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                          Excluido / Histórico
                          <span className="material-symbols-outlined text-[13px] opacity-60">block</span>
                        </span>
                      )}

                      {orderStatus === 'RECHAZADO' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Rechazado
                        </span>
                      )}
                    </button>
                  </td>

                  {/* Fecha */}
                  <td className="px-5 py-4 text-xs text-stone-500 whitespace-nowrap">
                    {o.createdAt.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                  </td>

                  {/* Total */}
                  <td className="px-5 py-4 font-extrabold text-sm text-[#0D0D0D] whitespace-nowrap">
                    S/ {o.total.toFixed(2)}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4 text-right flex justify-end gap-1.5 whitespace-nowrap">
                    {/* Botón Enviar individual a SUNAT (Solo si está pendiente) */}
                    {orderStatus === 'PENDIENTE' && (
                      <button 
                        onClick={() => handleSyncSunat(o.id)}
                        disabled={syncingSunat}
                        className="p-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all disabled:opacity-50"
                        title="Enviar a SUNAT manualmente ahora"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      </button>
                    )}

                    {/* Botón Excluir de SUNAT (Para compras pequeñas o ventas internas) */}
                    {orderStatus === 'PENDIENTE' && (
                      <button 
                        onClick={() => handleUpdateStatus(o.id, "HISTORICO")}
                        disabled={processingStatus}
                        className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all disabled:opacity-50"
                        title="Excluir de SUNAT (Marcar como compra pequeña / histórico para no enviar)"
                      >
                        <span className="material-symbols-outlined text-[18px]">block</span>
                      </button>
                    )}

                    {/* Botón Reactivar a Pendiente (Si fue excluida previamente) */}
                    {(orderStatus === 'HISTORICO' || orderStatus === 'EXCLUIDO') && (
                      <button 
                        onClick={() => handleUpdateStatus(o.id, "PENDIENTE")}
                        disabled={processingStatus}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
                        title="Reactivar a estado Pendiente para permitir envío a SUNAT"
                      >
                        <span className="material-symbols-outlined text-[18px]">restore</span>
                      </button>
                    )}

                    {/* Botón Ver CDR */}
                    <button 
                      onClick={() => setCdrModalOrder(o)}
                      className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                      title="Ver Constancia CDR y Detalles"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </button>

                    {/* Botón Imprimir Ticket */}
                    <button 
                      onClick={() => setPrintModalOrder(o)}
                      className="p-2 rounded-lg bg-[#BF391B]/5 text-[#BF391B] hover:bg-[#BF391B] hover:text-white transition-all"
                      title="Elegir Formato de Impresión (80mm, 58mm, A4)"
                    >
                      <span className="material-symbols-outlined text-[18px]">print</span>
                    </button>

                    {/* Botón Editar */}
                    <button 
                      onClick={() => openEditModal(o)}
                      className="p-2 rounded-lg bg-[#BF391B]/5 text-[#BF391B] hover:bg-[#BF391B] hover:text-white transition-all"
                      title="Editar Datos"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    {/* Botón Eliminar */}
                    <button 
                      onClick={() => handleDelete(o.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                      title="Eliminar Comprobante"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ticket Invisible */}
      <PrintTicket order={selectedOrder} />

      {/* Modal de Confirmación de Sincronización Manual con SUNAT */}
      {showSyncConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0D0D0D]">Enviar a SUNAT Manualmente</h3>
                <p className="text-xs text-stone-500">Confirmación antes de transmitir</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900 space-y-2">
              <p className="font-bold text-sm">
                Se enviarán {stats.pendiente.count} comprobante(s) en estado PENDIENTE.
              </p>
              <div className="flex justify-between items-center py-1.5 border-t border-amber-200/60 font-mono">
                <span>Monto Total a Declarar:</span>
                <span className="font-extrabold text-sm text-[#0D0D0D]">S/ {stats.pendiente.total.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                🛡️ <strong>Protección contra sobregiros:</strong> Los <strong>{stats.historico.count}</strong> comprobantes marcados como <strong>Excluido / Histórico</strong> (compras pequeñas) están protegidos y NO viajarán a SUNAT.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSyncConfirmModal(false)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSyncSunat()}
                disabled={syncingSunat}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-black text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                {syncingSunat ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Transmitiendo...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    Confirmar Envío
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Boleta */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[14px] w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-extrabold text-[#0D0D0D]">Editar Comprobante</h3>
              <button 
                onClick={() => setEditingOrder(null)} 
                className="text-stone-400 hover:text-stone-600 material-symbols-outlined"
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Tipo de Documento</label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#BF391B]"
                >
                  <option value="boleta">Boleta (DNI)</option>
                  <option value="factura">Factura (RUC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Estado SUNAT</label>
                <select
                  value={editSunatStatus}
                  onChange={(e) => setEditSunatStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#BF391B]"
                >
                  <option value="PENDIENTE">⏳ PENDIENTE (Pendiente de envío manual)</option>
                  <option value="HISTORICO">🚫 EXCLUIDO / HISTÓRICO (No enviar a SUNAT)</option>
                  <option value="ACEPTADO">✅ ACEPTADO (Declarado en SUNAT)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">Usa &quot;EXCLUIDO / HISTÓRICO&quot; para compras pequeñas o ventas internas que no deben viajar a SUNAT.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">N° Documento</label>
                <input
                  type="text"
                  required
                  value={editDoc}
                  onChange={(e) => setEditDoc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#BF391B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nombre / Razón Social</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#BF391B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">N° Comprobante</label>
                <input
                  type="text"
                  required
                  value={editVoucher}
                  onChange={(e) => setEditVoucher(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:border-[#BF391B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Monto Total (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#BF391B]"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-lg hover:bg-stone-50 transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#BF391B] hover:bg-[#8C2510] text-white font-bold rounded-lg transition-all text-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Selección de Formato de Impresión SUNAT */}
      {printModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0D0D0D]">Formatos de Impresión SUNAT</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{printModalOrder.voucherNumber || 'S/N'} • S/ {printModalOrder.total.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setPrintModalOrder(null)} 
                className="text-stone-400 hover:text-stone-600 material-symbols-outlined"
              >
                close
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4">Seleccione la medida o formato de salida para imprimir el comprobante:</p>

            <div className="space-y-3">
              {/* Opción 80mm */}
              <button
                onClick={() => {
                  printTicket80mm(printModalOrder);
                  setPrintModalOrder(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 hover:border-[#BF391B] hover:bg-[#BF391B]/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-[#BF391B]/10 flex items-center justify-center text-stone-700 group-hover:text-[#BF391B]">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    Ticket Térmico 80mm
                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold">Estándar</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">Ideal para impresoras de caja (Epson, Xprinter, Bixolon).</p>
                </div>
                <span className="material-symbols-outlined text-stone-400 group-hover:text-[#BF391B]">chevron_right</span>
              </button>

              {/* Opción 58mm */}
              <button
                onClick={() => {
                  printTicket58mm(printModalOrder);
                  setPrintModalOrder(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 hover:border-[#BF391B] hover:bg-[#BF391B]/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-[#BF391B]/10 flex items-center justify-center text-stone-700 group-hover:text-[#BF391B]">
                  <span className="material-symbols-outlined text-[24px]">receipt</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0D0D0D]">Ticket Compacto 58mm</div>
                  <p className="text-xs text-stone-500 mt-0.5">Para mini-impresoras térmicas portátiles o Bluetooth de mozo.</p>
                </div>
                <span className="material-symbols-outlined text-stone-400 group-hover:text-[#BF391B]">chevron_right</span>
              </button>

              {/* Opción A4 */}
              <button
                onClick={() => {
                  printInvoiceA4(printModalOrder);
                  setPrintModalOrder(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 hover:border-[#BF391B] hover:bg-[#BF391B]/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-[#BF391B]/10 flex items-center justify-center text-stone-700 group-hover:text-[#BF391B]">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    Formato A4 (Hoja Completa)
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">Corporativo</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">Diseño formal para facturas con RUC solicitadas por empresas.</p>
                </div>
                <span className="material-symbols-outlined text-stone-400 group-hover:text-[#BF391B]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / CRUD de Constancia de Recepción (CDR) y Descargas SUNAT */}
      {cdrModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  cdrModalOrder.sunatStatus === 'ACEPTADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">verified</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0D0D0D]">Constancia de Recepción (CDR)</h3>
                  <p className="text-xs text-stone-500 font-mono">{cdrModalOrder.voucherNumber || 'S/N'}</p>
                </div>
              </div>
              <button 
                onClick={() => setCdrModalOrder(null)} 
                className="text-stone-400 hover:text-stone-600 material-symbols-outlined"
              >
                close
              </button>
            </div>

            {/* Resumen de Estado */}
            <div className={`p-4 rounded-xl mb-4 border ${
              cdrModalOrder.sunatStatus === 'ACEPTADO'
                ? 'bg-green-50/70 border-green-200 text-green-900'
                : (cdrModalOrder.sunatStatus === 'HISTORICO' || cdrModalOrder.sunatStatus === 'EXCLUIDO')
                ? 'bg-stone-100 border-stone-200 text-stone-800'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between font-bold text-xs mb-1">
                <span>ESTADO DEL COMPROBANTE:</span>
                <span className="uppercase px-2 py-0.5 rounded bg-white/80 border text-[11px]">
                  {cdrModalOrder.sunatStatus || 'PENDIENTE'}
                </span>
              </div>
              <p className="text-xs leading-relaxed mt-1">
                {(cdrModalOrder.sunatStatus === 'HISTORICO' || cdrModalOrder.sunatStatus === 'EXCLUIDO')
                  ? 'Comprobante marcado como Excluido / Histórico. No será transmitido a SUNAT para evitar sobregiros por compras pequeñas.'
                  : cdrModalOrder.sunatCdrDesc || 'Comprobante emitido localmente con QR y Hash. Pendiente de envío manual a SUNAT.'}
              </p>
            </div>

            {/* Datos Técnicos */}
            <div className="space-y-3 mb-6 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tipo CPE:</span>
                  <span className="font-bold text-stone-800">
                    {cdrModalOrder.tipoDocumento === 'factura' ? '01 - Factura Electrónica' : '03 - Boleta Electrónica'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Emisor:</span>
                  <span className="font-bold text-stone-800">10418236103 (MISTER PEPE II)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Receptor:</span>
                  <span className="font-bold text-stone-800">{cdrModalOrder.clienteDocumento || '00000000'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Importe Total:</span>
                  <span className="font-bold text-stone-800">S/ {cdrModalOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Código CDR:</span>
                  <span className="font-bold text-stone-800">{cdrModalOrder.sunatCdrCode || '0 (Conforme)'}</span>
                </div>
              </div>

              {/* Hash Digital */}
              {cdrModalOrder.sunatHash && (
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Código Hash Digital (DigestValue)
                  </label>
                  <div className="p-2.5 bg-stone-100 rounded-lg font-mono text-[11px] text-stone-700 break-all select-all">
                    {cdrModalOrder.sunatHash}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones de Descarga */}
            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadInvoiceXml(cdrModalOrder)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-blue-600">code</span>
                  Descargar XML UBL
                </button>
                <button
                  onClick={() => downloadCdrXml(cdrModalOrder)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-green-600">verified</span>
                  Descargar CDR (XML)
                </button>
              </div>

              {cdrModalOrder.sunatStatus === 'PENDIENTE' && (
                <button
                  onClick={async () => {
                    await handleSyncSunat(cdrModalOrder.id);
                    setCdrModalOrder(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  Enviar a SUNAT Manualmente
                </button>
              )}

              {(cdrModalOrder.sunatStatus === 'HISTORICO' || cdrModalOrder.sunatStatus === 'EXCLUIDO') && (
                <button
                  onClick={async () => {
                    await handleUpdateStatus(cdrModalOrder.id, 'PENDIENTE');
                    setCdrModalOrder(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">restore</span>
                  Reactivar a Pendiente (Habilitar para envío a SUNAT)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
