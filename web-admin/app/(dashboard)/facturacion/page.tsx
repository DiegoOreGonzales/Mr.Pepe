"use client";
import { useState } from "react";
import { useBillingOrders, Order } from "@/lib/firebase/hooks";

// ── Componente de Boleta (DISEÑO PREMIUM IDENTICO AL MOVIL) ──────────────────

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
      <div className="print-receipt p-8 text-[#191C1E] bg-white w-[80mm] mx-auto text-[13px] font-sans leading-normal border border-stone-100">
        {/* Cabecera con Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
             <div className="w-20 h-20 bg-white flex items-center justify-center p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
          </div>
          <h2 className="text-[20px] font-black tracking-tight text-[#0D0D0D]">CHIO'S CHICKEN</h2>
          <p className="text-[10px] uppercase font-bold text-[#BF391B] tracking-[0.2em] mb-2">ROASTER & GRILL</p>
          
          <div className="space-y-0.5 text-[10px] text-stone-500 font-medium">
            <p>RUC: 10418236103</p>
            <p>JR. JUNIN 413 - EL TAMBO - HUANCAYO</p>
          </div>
        </div>

        {/* Tipo de Documento */}
        <div className="border-t border-stone-100 pt-5 pb-5 mb-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-1">
            {order.tipoDocumento === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}
          </p>
          <p className="text-[16px] font-black text-[#0D0D0D]">{ticketNumber}</p>
        </div>

        {/* Info Cliente */}
        <div className="mb-6 space-y-1.5 text-[11px]">
          <div className="flex gap-2">
            <span className="font-bold text-stone-900 w-12">{order.tipoDocumento === 'factura' ? 'RUC:' : 'DNI:'}</span>
            <span className="text-stone-600">{order.clienteDocumento || "-----------"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-stone-900 w-12">CLIENTE:</span>
            <span className="text-stone-600 uppercase flex-1">{order.clienteNombre || "CONSUMIDOR FINAL"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-stone-900 w-12">FECHA:</span>
            <span className="text-stone-600">{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Tabla de Items */}
        <table className="w-full text-[11px] mb-6">
          <thead>
            <tr className="text-left text-stone-400 border-b border-stone-100">
              <th className="pb-2 font-bold uppercase tracking-tighter">CANT DESCRIPCIÓN</th>
              <th className="pb-2 text-right font-bold uppercase tracking-tighter">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 text-stone-700">
                  <span className="font-bold text-stone-900">{item.cantidad} x</span> {item.nombre}
                </td>
                <td className="py-3 text-right font-bold text-stone-900">
                  S/ {(item.precio * item.cantidad).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t border-stone-100 pt-4 space-y-2">
          <div className="flex justify-between text-[11px] text-stone-500">
            <span>OP. GRAVADA</span>
            <span className="font-medium text-stone-900">S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-stone-500">
            <span>IGV (18%)</span>
            <span className="font-medium text-stone-900">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-stone-200 mt-2">
            <span className="text-[13px] font-black text-[#0D0D0D]">TOTAL A PAGAR</span>
            <span className="text-[18px] font-black text-[#0D0D0D]">S/ {totalPagar.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-10 space-y-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">¡Gracias por su preferencia!</p>
          <p className="text-[9px] text-[#BF391B] font-bold underline">www.chioschicken.com.pe</p>
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
