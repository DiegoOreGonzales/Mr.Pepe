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

function PrintTicket({ order }: { order: Order | null }) {
  if (!order) return null;
  
  const ticketNumber = order.voucherNumber || "S/N";
  // Calculamos montos (Asumiendo que el total ya incluye IGV o es la base)
  // Según tu captura, el total es la suma de Gravada + IGV
  const subtotal = order.total;
  const igv = subtotal * 0.18;
  const totalPagar = subtotal + igv;

  return (
    <div className="print-only">
      <div className="print-receipt p-8 text-black bg-white w-[80mm] mx-auto text-[13px] font-sans leading-normal border border-black/10">
        {/* Cabecera con Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
             <div className="w-20 h-20 bg-white flex items-center justify-center p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-black"><strong>MR. PEPE</strong></h2>
          <p className="text-[10px] uppercase font-bold text-black tracking-[0.2em] mb-2"><strong>ROASTER & GRILL</strong></p>
          
          <div className="space-y-0.5 text-[10px] text-black font-semibold">
            <p><strong>RUC: 10418236103</strong></p>
            <p>JR. JUNIN 413 - EL TAMBO - HUANCAYO</p>
          </div>
        </div>

        {/* Tipo de Documento */}
        <div className="border-t border-black border-dashed pt-5 pb-5 mb-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-black mb-1">
            <strong>{order.tipoDocumento === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}</strong>
          </p>
          <p className="text-[16px] font-black text-black"><strong>{ticketNumber}</strong></p>
        </div>

        {/* Info Cliente */}
        <div className="mb-6 space-y-1.5 text-[11px] text-black">
          <div className="flex gap-2">
            <span className="font-bold text-black w-12"><strong>{order.tipoDocumento === 'factura' ? 'RUC:' : 'DNI:'}</strong></span>
            <span className="text-black">{order.clienteDocumento || "-----------"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-black w-12"><strong>CLIENTE:</strong></span>
            <span className="text-black uppercase flex-1">{order.clienteNombre || "CONSUMIDOR FINAL"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-black w-12"><strong>FECHA:</strong></span>
            <span className="text-black">{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Tabla de Items */}
        <table className="w-full text-[11px] mb-6 border-b border-black">
          <thead>
            <tr className="text-left text-black border-b border-black">
              <th className="pb-2 font-bold uppercase tracking-tighter"><strong>CANT DESCRIPCIÓN</strong></th>
              <th className="pb-2 text-right font-bold uppercase tracking-tighter"><strong>TOTAL</strong></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 text-black">
                  <span className="font-bold text-black"><strong>{item.cantidad} x</strong></span> {item.nombre}
                </td>
                <td className="py-3 text-right font-bold text-black">
                  <strong>S/ {(item.precio * item.cantidad).toFixed(2)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t border-black pt-4 space-y-2 text-black">
          <div className="flex justify-between text-[11px]">
            <span><strong>OP. GRAVADA</strong></span>
            <span className="font-semibold text-black">S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span><strong>IGV (18%)</strong></span>
            <span className="font-semibold text-black">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-black border-double mt-2">
            <span className="text-[13px] font-black text-black"><strong>TOTAL A PAGAR</strong></span>
            <span className="text-[18px] font-black text-black"><strong>S/ {totalPagar.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Mensaje de Preferencia */}
        <div className="text-center mt-10 space-y-1">
          <p className="text-[10px] font-bold text-black uppercase tracking-widest"><strong>¡Gracias por su preferencia!</strong></p>
          <p className="text-[9px] text-[#BF391B] font-bold underline">www.mrpepe.com.pe</p>
        </div>
      </div>
    </div>
  );
}

export default function FacturacionPage() {
  const { orders, loading } = useBillingOrders();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handlePrint = (order: Order) => {
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 400);
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
      <DniLookup />

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
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handlePrint(o)}
                    className="p-2 rounded-lg bg-[#BF391B]/5 text-[#BF391B] hover:bg-[#BF391B] hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">print</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Invisible */}
      <PrintTicket order={selectedOrder} />
    </div>
  );
}
