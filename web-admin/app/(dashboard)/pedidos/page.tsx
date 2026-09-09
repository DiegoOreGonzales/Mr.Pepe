"use client";
import { useState, useEffect, useCallback } from "react";
import { Order } from "@/lib/firebase/hooks";
import { LOGO_BASE64 } from "@/lib/sunat/logo-base64";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "bg-orange-50",  text: "text-orange-600"  },
  preparando: { bg: "bg-red-50",     text: "text-red-600"     },
  listo:     { bg: "bg-green-50",   text: "text-green-600"   },
  entregado: { bg: "bg-blue-50",    text: "text-blue-600"    },
  pagado:    { bg: "bg-emerald-50", text: "text-emerald-700" },
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  preparando: "En Proceso",
  listo: "Listo",
  entregado: "Entregado",
  pagado: "Pagado",
};

export type TimeFilterPeriod = "hoy" | "ayer" | "semana" | "mes" | "personalizado" | "todos";

function formatOrderDate(date: Date): { primary: string; secondary: string } {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  if (isToday) {
    return { primary: `Hoy`, secondary: timeStr };
  }
  if (isYesterday) {
    return { primary: `Ayer`, secondary: timeStr };
  }
  return {
    primary: date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    secondary: timeStr,
  };
}

function printOrderTicket(order: Order) {
  const printWindow = window.open("", "_blank", "width=340,height=650");
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes (pop-ups) para poder imprimir.");
    return;
  }

  const itemsHtml = order.items?.map(item => `
    <tr style="border-bottom: 1px dashed rgba(0,0,0,0.2);">
      <td style="padding: 6px 0; font-family: monospace; font-size: 12px; font-weight: 800; color: #000;">
        ${item.cantidad} x ${item.nombre}
      </td>
      <td style="padding: 6px 0; font-family: monospace; font-size: 12px; font-weight: 800; text-align: right; color: #000;">
        S/ ${(item.precio * item.cantidad).toFixed(2)}
      </td>
    </tr>
  `).join("") || "";

  const html = `
    <html>
      <head>
        <title>Ticket - Mesa ${order.mesaNumero}</title>
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
          .subtitle { font-size: 11px; font-weight: 900; margin-bottom: 8px; }
          .meta { font-size: 12px; line-height: 1.4; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; }
          .total { font-size: 16px; font-weight: 900; text-align: right; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="display: flex; justify-content: center; margin-bottom: 6px;">
            <img src="${LOGO_BASE64}" style="max-height: 55px; width: auto; object-fit: contain;" alt="Logo" />
          </div>
          <div class="title">MR. PEPE II</div>
          <div class="subtitle">BROASTER Y BRASAS</div>
          <div class="divider"></div>
        </div>
        <div class="meta">
          <strong>MESA:</strong> MESA ${order.mesaNumero}<br/>
          <strong>FECHA:</strong> ${new Date(order.createdAt).toLocaleDateString("es-PE")} ${new Date(order.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}<br/>
          <strong>ESTADO:</strong> ${(STATUS_LABELS[order.status] || order.status).toUpperCase()}<br/>
          ${order.voucherNumber ? `<strong>COMPROBANTE:</strong> ${order.voucherNumber}<br/>` : ""}
          ${order.clienteNombre ? `<strong>CLIENTE:</strong> ${order.clienteNombre}<br/>` : ""}
        </div>
        <div class="divider"></div>
        <table class="table">
          <thead>
            <tr style="border-bottom: 2px solid #000;">
              <th style="text-align: left; font-size: 11px; font-weight: 900; padding-bottom: 5px;">PRODUCTO</th>
              <th style="text-align: right; font-size: 11px; font-weight: 900; padding-bottom: 5px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="total" style="font-size: 17px; font-weight: 900;">
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
  
  // Time Filter State
  const [period, setPeriod] = useState<TimeFilterPeriod>("hoy");
  const [customStart, setCustomStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (period === "hoy") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (period === "ayer") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return { start, end };
    }
    if (period === "semana") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (period === "mes") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (period === "personalizado") {
      const [sy, sm, sd] = customStart.split("-").map(Number);
      const [ey, em, ed] = customEnd.split("-").map(Number);
      const start = new Date(sy, (sm || 1) - 1, sd || 1, 0, 0, 0, 0);
      const end = new Date(ey, (em || 1) - 1, ed || 1, 23, 59, 59, 999);
      return { start, end };
    }
    // "todos"
    return { start: null, end: null };
  }, [period, customStart, customEnd]);

  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();
      params.set("limit", "1000");

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (start) {
        params.set("startDate", start.toISOString());
      }
      if (end) {
        params.set("endDate", end.toISOString());
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(
          json.data.map((o: any) => ({
            ...o,
            items: typeof o.items === "string" ? JSON.parse(o.items) : o.items || [],
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt),
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, [getDateRange, statusFilter]);

  // Initial load and filter change
  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  // Background polling (faster on "hoy", periodic on past ranges)
  useEffect(() => {
    const intervalMs = period === "hoy" ? 4000 : 15000;
    const timer = setInterval(() => {
      fetchOrders(false);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [fetchOrders, period]);

  const filtered = orders.filter((o: Order) => {
    const s = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      String(o.mesaNumero).includes(s) ||
      o.status.toLowerCase().includes(s) ||
      o.clienteNombre?.toLowerCase().includes(s) ||
      o.clienteDocumento?.includes(s) ||
      o.voucherNumber?.toLowerCase().includes(s) ||
      o.items?.some(it => it.nombre.toLowerCase().includes(s));

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSales = filtered.reduce((acc, o) => acc + (o.total || 0), 0);
  const avgTicket = filtered.length > 0 ? totalSales / filtered.length : 0;

  const handleExportCSV = () => {
    const headers = ["ID Pedido", "Mesa", "Cliente", "DNI / RUC", "Items / Productos", "Total (S/)", "Estado", "Fecha y Hora"];
    const rows = filtered.map((o: Order) => [
      o.id,
      `Mesa ${o.mesaNumero}`,
      o.clienteNombre || "Consumidor Final",
      o.clienteDocumento ? `="${o.clienteDocumento}"` : "00000000",
      o.items?.map(item => `${item.cantidad}x ${item.nombre}`).join(" | ") || "Sin items",
      o.total.toFixed(2),
      (STATUS_LABELS[o.status] || o.status).toUpperCase(),
      o.createdAt.toLocaleString("es-PE")
    ]);

    const periodLabel = 
      period === "hoy" ? "HOY" :
      period === "ayer" ? "AYER" :
      period === "semana" ? "ULTIMOS_7_DIAS" :
      period === "mes" ? "ESTE_MES" :
      period === "personalizado" ? `RANGO_${customStart}_AL_${customEnd}` : "HISTORIAL_COMPLETO";

    const csvContent = [
      ["sep=;"],
      ["MR. PEPE - BROASTER Y BRASAS"],
      [`REPORTE DE PEDIDOS - PERIODO: ${periodLabel}`],
      [`Fecha de exportacion: ${new Date().toLocaleString("es-PE")}`],
      [`Total pedidos: ${filtered.length} | Monto Total: S/ ${totalSales.toFixed(2)}`],
      [], 
      headers,
      ...rows
    ].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${periodLabel.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Metricas del Periodo */}
      <div className="bg-white rounded-2xl p-5 border border-stone-100 card-shadow space-y-4">
        {/* Fila 1: Filtro de Tiempo (Pills) + Selector de Rango */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-1.5 bg-stone-100/70 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setPeriod("hoy")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === "hoy"
                  ? "bg-white text-[#BF391B] shadow-sm font-extrabold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod("ayer")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === "ayer"
                  ? "bg-white text-[#BF391B] shadow-sm font-extrabold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => setPeriod("semana")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === "semana"
                  ? "bg-white text-[#BF391B] shadow-sm font-extrabold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setPeriod("mes")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === "mes"
                  ? "bg-white text-[#BF391B] shadow-sm font-extrabold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPeriod("personalizado")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === "personalizado"
                  ? "bg-white text-[#BF391B] shadow-sm font-extrabold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Personalizado
            </button>
            <button
              onClick={() => setPeriod("todos")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === "todos"
                  ? "bg-white text-[#BF391B] shadow-sm font-extrabold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Todo el Historial
            </button>
          </div>

          {/* Boton de Refrescar Manual */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg border border-stone-200 transition-all disabled:opacity-50 cursor-pointer"
            title="Refrescar lista"
          >
            <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin text-[#BF391B]" : ""}`}>
              refresh
            </span>
            <span>{isRefreshing ? "Cargando..." : "Actualizar"}</span>
          </button>
        </div>

        {/* Fila 2 (Condicional): Selector de Fechas si es Personalizado */}
        {period === "personalizado" && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#BF391B]">date_range</span>
              Rango de fechas:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase">Desde:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#BF391B]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase">Hasta:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#BF391B]"
              />
            </div>
            <button
              onClick={() => fetchOrders(true)}
              className="px-3 py-1.5 bg-[#BF391B] hover:bg-[#8C2510] text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Aplicar Filtro
            </button>
          </div>
        )}

        {/* Fila 3: Tarjetas de Resumen en Tiempo Real del Periodo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Pedidos Registrados</p>
              <h4 className="text-lg font-black text-[#0D0D0D]">{filtered.length}</h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">receipt</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ventas del Período</p>
              <h4 className="text-lg font-black text-[#1A8952]">S/ {totalSales.toFixed(2)}</h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">attach_money</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ticket Promedio</p>
              <h4 className="text-lg font-black text-stone-800">S/ {avgTicket.toFixed(2)}</h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Busqueda, Filtro de Estado y Exportacion */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar por mesa, producto, cliente o estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none border border-[#E4E7EC] bg-white focus:border-[#BF391B] transition-all card-shadow"
            />
          </div>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-[#E4E7EC] bg-white focus:outline-none focus:border-[#BF391B] text-stone-700 card-shadow cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="preparando">En Proceso</option>
            <option value="listo">Listos</option>
            <option value="entregado">Entregados</option>
            <option value="pagado">Pagados</option>
          </select>

          <span className="text-xs text-[#9AA0A6] font-medium">{filtered.length} pedidos</span>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E4E7EC] hover:bg-stone-50 text-stone-700 hover:text-black font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
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
                {["Mesa", "Items", "Total", "Estado", "Fecha y Hora", "Acciones"].map((h, i) => (
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
                    <p className="text-[#9AA0A6] text-sm">No se encontraron pedidos en el período seleccionado</p>
                    <p className="text-xs text-stone-400 mt-1">Prueba seleccionando "Últimos 7 días", "Este Mes" o "Todo el Historial".</p>
                  </td>
                </tr>
              ) : (
                filtered.map((o: Order) => {
                  const st = STATUS_STYLES[o.status] ?? STATUS_STYLES.entregado;
                  const dateFormatted = formatOrderDate(o.createdAt);
                  return (
                    <tr key={o.id} className="border-t border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="w-8 h-8 rounded-lg bg-[#BF391B] text-white text-[10px] font-extrabold flex items-center justify-center">
                          M{o.mesaNumero}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#9AA0A6]">
                        <span className="font-bold text-stone-800">{o.items?.length ?? 0}</span> items
                        {o.items && o.items.length > 0 && (
                          <p className="text-[11px] text-stone-400 truncate max-w-xs">
                            {o.items.map(it => `${it.cantidad}x ${it.nombre}`).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#0D0D0D] text-sm">S/ {o.total.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${st.bg} ${st.text}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-stone-600">
                        <div className="font-bold text-stone-800">{dateFormatted.primary}</div>
                        <div className="text-[11px] text-stone-400">{dateFormatted.secondary}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right flex justify-end gap-2.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="w-8 h-8 rounded-lg border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-[#9AA0A6] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                          title="Ver Detalle"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={() => printOrderTicket(o)}
                          className="w-8 h-8 rounded-lg border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-[#9AA0A6] hover:text-[#BF391B] transition-colors cursor-pointer"
                          title="Imprimir Ticket"
                        >
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

      {/* Detalle de Pedido Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
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
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600 material-symbols-outlined cursor-pointer">
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
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all text-xs cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  printOrderTicket(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 bg-[#BF391B] hover:bg-[#8C2510] text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
