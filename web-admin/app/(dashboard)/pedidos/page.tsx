"use client";
import { useState } from "react";
import { useReportOrders, Order } from "@/lib/firebase/hooks";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "bg-orange-50",  text: "text-orange-600"  },
  enProceso: { bg: "bg-red-50",     text: "text-red-600"     },
  listo:     { bg: "bg-green-50",   text: "text-green-600"   },
  entregado: { bg: "bg-stone-100",  text: "text-stone-500"   },
};
const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente", enProceso: "En Proceso", listo: "Listo", entregado: "Entregado",
};

export default function PedidosPage() {
  const [search, setSearch] = useState("");
  const { orders, loading } = useReportOrders("hoy");

  const filtered = orders.filter((o: Order) =>
    search === "" || String(o.mesaNumero).includes(search) || o.status.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar por mesa o estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[10px] outline-none border border-[#E4E7EC] bg-white focus:border-[#BF391B] transition-all"
          />
        </div>
        <span className="text-xs text-[#9AA0A6] font-medium">{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8F9FA]">
              <tr>
                {["Mesa","Items","Total","Estado","Hora","Acción"].map((h, i) => (
                  <th key={h} className={`px-5 py-4 text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest ${i === 5 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-stone-200 block mb-2">receipt_long</span>
                    <p className="text-[#9AA0A6] text-sm">Sin pedidos</p>
                  </td>
                </tr>
              ) : (
                filtered.map((o: Order) => {
                  const st = STATUS_STYLES[o.status] ?? STATUS_STYLES.entregado;
                  return (
                    <tr key={o.id} className="border-t border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="w-8 h-8 rounded-lg bg-[#BF391B] text-white text-[10px] font-extrabold flex items-center justify-center">
                          M{o.mesaNumero}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#9AA0A6]">{o.items?.length ?? 0} items</td>
                      <td className="px-5 py-3.5 font-bold text-[#0D0D0D] text-sm">S/ {o.total.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${st.bg} ${st.text}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#9AA0A6]">
                        {o.createdAt.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => window.print()} className="text-[#9AA0A6] hover:text-[#BF391B] transition-colors">
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
