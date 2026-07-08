"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { useReportOrders, ReportPeriod, Order } from "@/lib/firebase/hooks";

// ── Compute metrics from orders ───────────────────────────────────────────────

function computeMetrics(orders: Order[]) {
  const completed = orders.filter((o) => o.status !== "pendiente");
  const totalSales  = completed.reduce((s, o) => s + o.total, 0);
  const totalOrders = completed.length;

  // Hourly sales (0-23)
  const hourlySales: number[] = Array(24).fill(0);
  completed.forEach((o) => {
    const h = o.createdAt.getHours();
    hourlySales[h] += o.total;
  });

  // Table usage
  const tableMap: Record<number, number> = {};
  completed.forEach((o) => {
    tableMap[o.mesaNumero] = (tableMap[o.mesaNumero] ?? 0) + 1;
  });
  const tableUsage = Object.entries(tableMap)
    .map(([mesa, count]) => ({ mesa: `M${mesa}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Top products
  const prodMap: Record<string, { units: number; revenue: number }> = {};
  completed.forEach((o) => {
    o.items?.forEach((item) => {
      const name = item.nombre ?? "Producto";
      if (!prodMap[name]) prodMap[name] = { units: 0, revenue: 0 };
      prodMap[name].units   += item.cantidad ?? 1;
      prodMap[name].revenue += (item.precio ?? 0) * (item.cantidad ?? 1);
    });
  });
  const topProducts = Object.entries(prodMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 6);

  return {
    totalSales,
    totalOrders,
    averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
    hourlySales: hourlySales.map((v, i) => ({ hora: `${i}h`, ventas: v })),
    tableUsage,
    topProducts,
  };
}

// ── Metric Mini Card ──────────────────────────────────────────────────────────

function MetricCard({
  label, value, delta, icon, color,
}: {
  label: string; value: string; delta?: string; icon: string; color: string;
}) {
  return (
    <div className="bg-white rounded-[14px] p-6 border border-stone-100/50 card-shadow flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-[20px]" style={{ color }}>
          {icon}
        </span>
        {delta && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ color, background: color + "18" }}
          >
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-[#0D0D0D] tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

// ── Main Reports Page ─────────────────────────────────────────────────────────

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "hoy",    label: "HOY"          },
  { key: "semana", label: "ESTA SEMANA"  },
  { key: "mes",    label: "ESTE MES"     },
];

export default function ReportesPage() {
  const [period, setPeriod] = useState<ReportPeriod>("hoy");
  const { orders, loading } = useReportOrders(period);
  const metrics = useMemo(() => computeMetrics(orders), [orders]);

  const maxTableCount = Math.max(...metrics.tableUsage.map((t) => t.count), 1);

  return (
    <div className="space-y-7 print-only">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#BF391B] tracking-tight">Reportes</h1>
          <p className="text-xs text-[#9AA0A6] font-medium mt-0.5">Rendimiento real del restaurante</p>
        </div>

        {/* Period filter */}
        <div className="flex bg-[#F0F2F5] p-1 rounded-xl gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 text-[10px] font-bold rounded-lg tracking-wider transition-all duration-200 ${
                period === p.key
                  ? "bg-white text-[#BF391B] shadow-sm"
                  : "text-[#9AA0A6] hover:text-[#0D0D0D]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <MetricCard
              label="Total Ventas"
              value={`S/ ${metrics.totalSales.toFixed(2)}`}
              delta={period.toUpperCase()}
              icon="payments"
              color="#F59E0B"
            />
            <MetricCard
              label="Ticket Promedio"
              value={`S/ ${metrics.averageTicket.toFixed(2)}`}
              delta="PROMEDIO"
              icon="confirmation_number"
              color="#1A6FBF"
            />
            <MetricCard
              label="Pedidos Entregados"
              value={String(metrics.totalOrders)}
              delta="TOTAL"
              icon="shopping_bag"
              color="#7B4FBF"
            />
            <MetricCard
              label="Mesas Activas"
              value={String(metrics.tableUsage.length)}
              delta="USO REAL"
              icon="table_restaurant"
              color="#1A8952"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Line chart: sales flow */}
            <div className="xl:col-span-2 bg-white rounded-[14px] p-6 border border-stone-100/50 card-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wide">
                    Flujo de Ventas (S/)
                  </h3>
                  <p className="text-[10px] text-[#9AA0A6] mt-0.5">Distribución por hora del día</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#BF391B]" />
                  <span className="text-[10px] font-semibold text-[#9AA0A6]">Ventas S/</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={metrics.hourlySales}>
                  <CartesianGrid stroke="#F0F2F5" strokeDasharray="0" />
                  <XAxis
                    dataKey="hora"
                    tick={{ fontSize: 10, fill: "#9AA0A6", fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9AA0A6" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `S/${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E4E7EC",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                    formatter={(v: any) => [`S/ ${Number(v || 0).toFixed(2)}`, "Ventas"]}
                  />
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#BF391B" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#BF391B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#BF391B"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: "#BF391B", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart: table usage */}
            <div className="bg-white rounded-[14px] p-6 border border-stone-100/50 card-shadow">
              <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wide mb-1">
                Mesas más Usadas
              </h3>
              <p className="text-[10px] text-[#9AA0A6] mb-6">Frecuencia de rotación</p>

              {metrics.tableUsage.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[#9AA0A6]">
                  <span className="material-symbols-outlined text-4xl mb-2 text-stone-200">table_restaurant</span>
                  <p className="text-xs">Sin datos de mesas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.tableUsage.map((t) => (
                    <div key={t.mesa}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-[#0D0D0D]">{t.mesa}</span>
                        <span className="text-xs font-bold text-[#9AA0A6]">{t.count} rot.</span>
                      </div>
                      <div className="h-2.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(t.count / maxTableCount) * 100}%`,
                            background: "linear-gradient(135deg, #8C2510 0%, #BF391B 50%, #E54D2A 100%)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-[14px] border border-stone-100/50 card-shadow overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-stone-50">
              <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wide">Top Productos</h3>
              <button
                onClick={() => {
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Reporte Top Productos - Mr Pepe</title>
                        <meta charset="utf-8" />
                        <style>
                          body { font-family: 'Inter', sans-serif; color: #0D0D0D; margin: 40px; }
                          .header { text-align: center; margin-bottom: 40px; display: flex; flex-direction: column; align-items: center; }
                          .logo { max-width: 120px; margin-bottom: 10px; }
                          .title { font-size: 26px; font-weight: 900; color: #BF391B; margin: 0; }
                          .subtitle { font-size: 13px; color: #9AA0A6; margin: 5px 0 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; }
                          .meta-info { margin-top: 20px; font-size: 11px; color: #555; border-top: 1px solid #E4E7EC; border-bottom: 1px solid #E4E7EC; padding: 12px; width: 100%; max-width: 600px; text-align: left; }
                          table { width: 100%; max-width: 600px; border-collapse: collapse; margin: 30px auto 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border-radius: 12px; overflow: hidden; }
                          th { background-color: #F8F9FA; padding: 14px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9AA0A6; border-bottom: 2px solid #E4E7EC; text-align: left; }
                          td { padding: 14px 18px; font-size: 13px; border-bottom: 1px solid #F0F2F5; color: #0D0D0D; text-align: left; }
                          .bold { font-weight: 700; }
                          .text-right { text-align: right; }
                          .text-center { text-align: center; }
                          .rank { display: inline-flex; width: 24px; height: 24px; background: #BF391B15; color: #BF391B; border-radius: 6px; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; margin-right: 10px; }
                          @media print {
                            .no-print { display: none; }
                            body { margin: 20px; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <img class="logo" src="/logo.png" alt="Mr Pepe Logo" />
                          <h1 class="title">MR. PEPE</h1>
                          <p class="subtitle">Broaster y Brasas</p>
                          <div class="meta-info">
                            <p style="margin: 3px 0;"><strong>REPORTE DE VENTAS:</strong> TOP PRODUCTOS</p>
                            <p style="margin: 3px 0;"><strong>PERÍODO:</strong> ${period.toUpperCase()}</p>
                            <p style="margin: 3px 0;"><strong>FECHA DE EXPORTACIÓN:</strong> ${new Date().toLocaleString("es-PE")}</p>
                          </div>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th style="text-align: left;">Ranking / Producto</th>
                              <th class="text-center">Unidades Vendidas</th>
                              <th class="text-right">Ingresos Totales (S/)</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${metrics.topProducts.map((p, idx) => `
                              <tr>
                                <td><span class="rank">#${idx + 1}</span><span class="bold">${p.name}</span></td>
                                <td class="text-center bold">${p.units}</td>
                                <td class="text-right bold">S/ ${p.revenue.toFixed(2)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                        <div class="no-print" style="margin-top: 40px; text-align: center;">
                          <button onclick="window.print()" style="padding: 12px 24px; background: #BF391B; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(191, 57, 27, 0.2);">Imprimir o Guardar PDF</button>
                        </div>
                      </body>
                    </html>
                  `;
                  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
                className="text-xs font-bold text-[#BF391B] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Exportar Reporte Imprimible
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FA]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest">Producto</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest text-center">Unidades</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest">Rendimiento</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest text-right">Ingresos (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {metrics.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-[#9AA0A6] text-sm">
                        Sin datos de productos para este período
                      </td>
                    </tr>
                  ) : (
                    metrics.topProducts.map((p, idx) => {
                      const maxUnits = metrics.topProducts[0]?.units ?? 1;
                      const pct = Math.round((p.units / maxUnits) * 100);
                      return (
                        <tr key={p.name} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-[#BF391B]/10 text-[#BF391B] text-[10px] font-extrabold flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <span className="text-sm font-bold text-[#0D0D0D]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-[#0D0D0D]">
                            {p.units}
                          </td>
                          <td className="px-6 py-4 min-w-[180px]">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full ember-gradient"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-[#9AA0A6]">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-[#0D0D0D]">
                            S/ {p.revenue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
