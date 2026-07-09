"use client";
import { useState } from "react";
import { useReportOrders, Order } from "@/lib/firebase/hooks";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "bg-orange-50",  text: "text-orange-600"  },
  preparando: { bg: "bg-red-50",     text: "text-red-600"     },
  listo:     { bg: "bg-green-50",   text: "text-green-600"   },
  entregado: { bg: "bg-stone-100",  text: "text-stone-500"   },
};
const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente", preparando: "En Proceso", listo: "Listo", entregado: "Entregado",
};

function printOrderTicket(order: Order) {
  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes (pop-ups) para poder imprimir.");
    return;
  }

  const itemsHtml = order.items?.map(item => `
    <tr style="border-bottom: 1px dashed rgba(0,0,0,0.15);">
      <td style="padding: 5px 0; font-family: monospace; font-size: 13px; font-weight: 800; color: #000;">
        ${item.cantidad} x ${item.nombre}
      </td>
      <td style="padding: 5px 0; font-family: monospace; font-size: 13px; font-weight: 800; text-align: right; color: #000;">
        S/ ${(item.precio * item.cantidad).toFixed(2)}
      </td>
    </tr>
  `).join("") || "";

  const html = `
    <html>
      <head>
        <title>Imprimir Ticket - Mesa ${order.mesaNumero}</title>
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
          .title { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
          .subtitle { font-size: 12px; font-weight: 900; margin-bottom: 8px; }
          .meta { font-size: 12px; line-height: 1.4; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; }
          .total { font-size: 16px; font-weight: 900; text-align: right; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <img src="${window.location.origin}/logo.png" style="max-height: 45px; width: auto; margin-bottom: 6px; object-fit: contain;" alt="Logo" /><br/>
          <div class="title">MR. PEPE</div>
          <div class="subtitle">Broaster y Brasas</div>
          <div class="divider"></div>
        </div>
        <div class="meta">
          <strong>MESA:</strong> MESA ${order.mesaNumero}<br/>
          <strong>FECHA:</strong> ${new Date(order.createdAt).toLocaleDateString("es-PE")} ${new Date(order.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}<br/>
          <strong>ESTADO:</strong> ${(STATUS_LABELS[order.status] || order.status).toUpperCase()}
        </div>
        <div class="divider"></div>
        <table class="table">
          <thead>
            <tr style="border-bottom: 2px solid #000;">
              <th style="text-align: left; font-size: 12px; font-weight: 900; padding-bottom: 5px;">PRODUCTO</th>
              <th style="text-align: right; font-size: 12px; font-weight: 900; padding-bottom: 5px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="total" style="font-size: 18px; font-weight: 900;">
          TOTAL: S/ ${order.total.toFixed(2)}
        </div>
        <div class="divider" style="margin-top: 15px;"></div>
        <div class="text-center subtitle" style="margin-top: 8px;">
          ¡Gracias por su preferencia!
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

export default function PedidosPage() {
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, loading } = useReportOrders("hoy");

  const filtered = orders.filter((o: Order) =>
    search === "" || String(o.mesaNumero).includes(search) || o.status.includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ["ID Pedido", "Mesa", "Items / Productos", "Total (S/)", "Estado", "Fecha y Hora"];
    const rows = filtered.map((o: Order) => [
      o.id,
      `Mesa ${o.mesaNumero}`,
      o.items?.map(item => `${item.cantidad}x ${item.nombre}`).join(" | ") || "Sin items",
      o.total.toFixed(2),
      (STATUS_LABELS[o.status] || o.status).toUpperCase(),
      o.createdAt.toLocaleString("es-PE")
    ]);

    // Formato con cabecera de la marca, BOM y delimitador ';' para Excel en español
    const csvContent = [
      ["sep=;"], // Forzar delimitador punto y coma para Excel
      ["MR. PEPE - BROASTER Y BRASAS"],
      ["REPORTE GENERAL DE PEDIDOS DE HOY"],
      [`Fecha de exportación: ${new Date().toLocaleString("es-PE")}`],
      [], 
      headers,
      ...rows
    ].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_mrpepe_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Search & Export */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
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
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#E4E7EC] hover:bg-stone-50 text-stone-700 hover:text-black font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8F9FA]">
              <tr>
                {["Mesa","Items","Total","Estado","Hora","Acciones"].map((h, i) => (
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
                      <td className="px-5 py-3.5 text-right flex justify-end gap-2.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="text-[#9AA0A6] hover:text-[#0D0D0D] transition-colors"
                          title="Ver Detalle"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {o.status === "pagado" && (
                          <button
                            onClick={() => printOrderTicket(o)}
                            className="text-[#9AA0A6] hover:text-[#BF391B] transition-colors"
                            title="Imprimir Ticket"
                          >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de Pedido Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-stone-100 flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#BF391B] text-white text-[10px] font-extrabold flex items-center justify-center">
                  M{selectedOrder.mesaNumero}
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0D0D0D]">Detalle de Pedido</h3>
                  <p className="text-[10px] text-stone-400 font-semibold uppercase">{selectedOrder.createdAt.toLocaleString("es-PE")}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600 material-symbols-outlined">
                close
              </button>
            </div>

            <div className="divide-y divide-stone-100/60 max-h-60 overflow-y-auto pr-1">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-xs">
                  <span>
                    <strong className="text-[#0D0D0D]">{item.cantidad}x</strong> {item.nombre}
                  </span>
                  <span className="font-bold text-stone-700">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                <p className="py-6 text-center text-stone-400 text-xs italic">Sin items en el pedido</p>
              )}
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-bold text-stone-500">Monto Total:</span>
              <span className="text-lg font-black text-[#BF391B]">S/ {selectedOrder.total.toFixed(2)}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  printOrderTicket(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 bg-[#BF391B] hover:bg-[#8C2510] text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
