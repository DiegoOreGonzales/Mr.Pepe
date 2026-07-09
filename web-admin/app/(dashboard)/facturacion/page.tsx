"use client";
import { useState, useRef, useCallback } from "react";
import { useBillingOrders, Order } from "@/lib/firebase/hooks";

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
  const subtotal = order.total;
  const igv = subtotal * 0.18;
  const totalPagar = subtotal + igv;

  const itemsHtml = order.items?.map(item => `
    <tr style="border-bottom: 1px dashed rgba(0,0,0,0.15);">
      <td style="padding: 6px 0; font-family: monospace; font-size: 13px; font-weight: 800; color: #000;">
        ${item.cantidad} x ${item.nombre}
      </td>
      <td style="padding: 6px 0; font-family: monospace; font-size: 13px; font-weight: 800; text-align: right; color: #000;">
        S/ ${(item.precio * item.cantidad).toFixed(2)}
      </td>
    </tr>
  `).join("") || "";

  const html = `
    <html>
      <head>
        <title>Ticket - ${ticketNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 15px 5px;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          * {
            color: #000 !important;
            font-weight: 900 !important;
          }
          .text-center { text-align: center; }
          .divider { border-top: 2px dashed #000; margin: 10px 0; }
          .title { font-size: 20px; font-weight: 900; margin-bottom: 2px; }
          .subtitle { font-size: 11px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; }
          .meta { font-size: 12px; line-height: 1.4; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; }
          .totals-table { width: 100%; margin-top: 10px; }
          .totals-table td { padding: 3px 0; font-size: 12px; font-weight: 900; }
          .total-row { font-size: 16px; font-weight: 900; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="display: flex; justify-content: center; margin-bottom: 8px;">
            <img src="${window.location.origin}/logo.png" style="max-height: 60px; width: auto; object-fit: contain;" alt="Logo" />
          </div>
          <div class="title">MR. PEPE</div>
          <div class="subtitle">BROASTER Y BRASAS</div>
          <div style="font-size: 11px; font-weight: 900; margin-bottom: 5px;">RUC: 10418236103</div>
          <div style="font-size: 10px; font-weight: 900;">JR. JUNIN 413 - EL TAMBO - HUANCAYO</div>
          <div class="divider"></div>
          
          <div style="font-size: 13px; font-weight: 900; text-transform: uppercase;">
            ${order.tipoDocumento === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}
          </div>
          <div style="font-size: 16px; font-weight: 900; margin-top: 3px;">
            ${ticketNumber}
          </div>
          <div class="divider"></div>
        </div>

        <div class="meta">
          <strong>${order.tipoDocumento === 'factura' ? 'RUC:' : 'DNI:'}</strong> ${order.clienteDocumento || "-----------"}<br/>
          <strong>CLIENTE:</strong> ${(order.clienteNombre || "CONSUMIDOR FINAL").toUpperCase()}<br/>
          <strong>FECHA:</strong> ${new Date(order.createdAt).toLocaleDateString("es-PE")} ${new Date(order.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}<br/>
          <strong>MESA:</strong> MESA ${order.mesaNumero}
        </div>
        <div class="divider"></div>

        <table class="table">
          <thead>
            <tr style="border-bottom: 2px solid #000;">
              <th style="text-align: left; font-size: 12px; font-weight: 900; padding-bottom: 5px;">CANT DESCRIPCIÓN</th>
              <th style="text-align: right; font-size: 12px; font-weight: 900; padding-bottom: 5px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals-table">
          <tr>
            <td>OP. GRAVADA</td>
            <td style="text-align: right;">S/ ${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>IGV (18%)</td>
            <td style="text-align: right;">S/ ${igv.toFixed(2)}</td>
          </tr>
          <tr class="total-row" style="border-top: 2px double #000; padding-top: 5px;">
            <td style="font-size: 14px; font-weight: 900; padding-top: 6px;">TOTAL A PAGAR</td>
            <td style="text-align: right; font-size: 18px; font-weight: 900; padding-top: 6px;">S/ ${totalPagar.toFixed(2)}</td>
          </tr>
        </table>

        <div class="divider" style="margin-top: 20px;"></div>
        <div class="text-center" style="margin-top: 8px;">
          <div style="font-size: 11px; font-weight: 900; text-transform: uppercase;">¡Gracias por su preferencia!</div>
          <div style="font-size: 10px; font-weight: 900; margin-top: 2px;">www.mrpepe.com.pe</div>
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
  const { orders, loading } = useBillingOrders();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit / Delete State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDoc, setEditDoc] = useState("");
  const [editTipo, setEditTipo] = useState<"boleta" | "factura">("boleta");
  const [editVoucher, setEditVoucher] = useState("");
  const [editTotal, setEditTotal] = useState("");

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
          total: parseFloat(editTotal)
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingOrder(null);
        alert("Comprobante editado correctamente");
      } else {
        alert("Error al editar: " + json.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al editar");
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
        alert("Comprobante eliminado con éxito");
      } else {
        alert("Error al eliminar: " + json.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al eliminar");
    }
  };

  const filtered = orders.filter(o => 
    search === "" || 
    o.clienteNombre?.toLowerCase().includes(search.toLowerCase()) ||
    o.clienteDocumento?.includes(search) ||
    o.voucherNumber?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Consulta DNI - RENIEC */}
      <div className="no-print">
        <DniLookup />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4 no-print">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] text-[20px]">search</span>
          <input
            type="text"
            placeholder="Buscar por DNI, Nombre o N° Boleta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-100 outline-none focus:border-[#BF391B] transition-all bg-white card-shadow text-sm"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-stone-100 text-xs font-bold text-stone-500">
          <span className="w-2 h-2 rounded-full bg-[#1A8952] animate-pulse" />
          {filtered.length} COMPROBANTES
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-stone-50">
            <tr className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest">
              <th className="px-6 py-4">N° Boleta</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-6 py-4 animate-pulse bg-stone-50/50 h-16"></td></tr>
              ))
            ) : filtered.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-[#BF391B]">{o.voucherNumber || "S/N"}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-[#0D0D0D] uppercase">{o.clienteNombre || "Consumidor Final"}</p>
                  <p className="text-[10px] text-[#9AA0A6]">{o.clienteDocumento || "Sin DNI"}</p>
                </td>
                <td className="px-6 py-4 text-xs text-stone-500">
                  {o.createdAt.toLocaleString()}
                </td>
                <td className="px-6 py-4 font-extrabold text-sm text-[#0D0D0D]">
                  S/ {o.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-1.5">
                  <button 
                    onClick={() => handlePrint(o)}
                    className="p-2 rounded-lg bg-[#BF391B]/5 text-[#BF391B] hover:bg-[#BF391B] hover:text-white transition-all"
                    title="Imprimir Boleta"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </button>
                  <button 
                    onClick={() => openEditModal(o)}
                    className="p-2 rounded-lg bg-[#BF391B]/5 text-[#BF391B] hover:bg-[#BF391B] hover:text-white transition-all"
                    title="Editar Datos"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(o.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                    title="Eliminar Boleta"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Invisible */}
      <PrintTicket order={selectedOrder} />

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
    </div>
  );
}
