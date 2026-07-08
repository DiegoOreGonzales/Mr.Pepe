"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDayMetrics, useRecentOrders, useMesas, Order, Mesa } from "@/lib/firebase/hooks";
import TableOrderModal from "@/components/TableOrderModal";

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pendiente:  "PENDIENTE",
  preparando: "EN PROCESO",
  listo:      "LISTO",
  entregado:  "ENTREGADO",
  pagado:     "PAGADO",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pendiente:  { bg: "bg-orange-50",  text: "text-orange-600" },
  preparando: { bg: "bg-red-50",     text: "text-red-600"    },
  listo:      { bg: "bg-green-50",   text: "text-green-600"  },
  entregado:  { bg: "bg-stone-100",  text: "text-stone-500"  },
  pagado:     { bg: "bg-purple-50", text: "text-purple-600" },
};

function minutesSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, accent, progress,
}: {
  label: string; value: string; sub: string;
  icon: string; accent: string; progress: number;
}) {
  return (
    <div className="bg-white rounded-[14px] p-6 flex flex-col gap-1 border border-stone-100/60 card-shadow animate-fade-in">
      <div className="flex items-end justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9AA0A6]">
          {label}
        </span>
        <span
          className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ color: accent, background: accent + "18" }}
        >
          <span className="material-symbols-outlined text-xs">{icon}</span>
        </span>
      </div>
      <div className="text-[2rem] font-extrabold text-[#0D0D0D] leading-tight tracking-tighter">
        {value}
      </div>
      <p className="text-[11px] text-[#9AA0A6]">{sub}</p>
      <div className="w-full h-1 rounded-full mt-3 overflow-hidden" style={{ background: accent + "20" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress, 100)}%`, background: accent }}
        />
      </div>
    </div>
  );
}

// ── Order Row ─────────────────────────────────────────────────────────────────

function OrderRow({ order, onAttend }: { order: Order; onAttend: (mesaNumero: number) => void }) {
  const mins    = minutesSince(order.createdAt);
  const styles  = STATUS_STYLES[order.status] ?? STATUS_STYLES.entregado;
  const isPulse = order.status === "preparando";

  return (
    <tr className="hover:bg-stone-50 transition-colors duration-150">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0"
            style={{ background: "#BF391B" }}
          >
            M{order.mesaNumero}
          </span>
          <span className="font-bold text-[#0D0D0D] text-sm">Mesa {order.mesaNumero}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[#9AA0A6] text-sm font-medium">
        hace {mins} min
      </td>
      <td className="px-5 py-3.5 font-bold text-[#0D0D0D] text-sm">
        S/ {order.total.toFixed(2)}
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${styles.bg} ${styles.text} ${isPulse ? "animate-pending" : ""}`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
        <button
          onClick={() => onAttend(order.mesaNumero)}
          className="text-[#9AA0A6] hover:text-[#BF391B] transition-colors"
          title="Atender Mesa"
        >
          <span className="material-symbols-outlined text-[20px]">restaurant</span>
        </button>
        <button
          onClick={() => window.print()}
          className="text-[#9AA0A6] hover:text-[#BF391B] transition-colors"
          title="Imprimir orden"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
        </button>
      </td>
    </tr>
  );
}

// ── Status Bar ────────────────────────────────────────────────────────────────

function StatusBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest">{label} ({count})</span>
        <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: color + "20" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({ icon, label, sub, onClick }: {
  icon: string; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-center justify-between bg-white rounded-xl ghost-border hover:bg-stone-50 transition-all duration-200 group text-left"
    >
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined p-2 bg-[#BF391B]/10 text-[#BF391B] rounded-lg text-[20px]">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold text-[#0D0D0D]">{label}</p>
          <p className="text-[10px] text-[#9AA0A6]">{sub}</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-stone-300 group-hover:text-[#BF391B] transition-colors text-[18px]">
        chevron_right
      </span>
    </button>
  );
}

// ── Componente de Boleta (Solo para Impresión) ────────────────────────────────

function PrintTicket({ order }: { order: Order | null }) {
  if (!order) return null;

  return (
    <div className="print-only hidden">
      <div className="print-receipt p-4 text-black bg-white w-[80mm] mx-auto text-[12px] font-mono leading-tight">
        <div className="text-center mb-4">
          <h2 className="text-lg font-black"><strong>MR. PEPE</strong></h2>
          <p className="text-[10px] uppercase font-bold"><strong>Broaster y Brasas</strong></p>
          <div className="w-12 h-px bg-black mx-auto my-1" />
          <p className="text-[10px]"><strong>RUC: 10418236103</strong></p>
          <p className="text-[10px]">JR. JUNIN 413 - EL TAMBO - HUANCAYO</p>
        </div>

        <div className="border-t border-b border-black border-dashed py-2 mb-3">
          <p className="text-center font-black"><strong>BOLETA DE VENTA</strong></p>
          <p className="text-center font-black"><strong>B001-000577</strong></p>
        </div>

        <div className="mb-4 space-y-0.5 text-[10px]">
          <p><strong>DNI:</strong> {order.clienteDocumento || "-----------"}</p>
          <p><strong>CLIENTE:</strong> {order.clienteNombre || "CONSUMIDOR FINAL"}</p>
          <p><strong>FECHA:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>MESA:</strong> {order.mesaNumero}</p>
        </div>

        <table className="w-full text-[10px] mb-4">
          <thead className="border-b border-black">
            <tr>
              <th className="text-left py-1"><strong>CANT</strong></th>
              <th className="text-left py-1"><strong>DESCRIPCIÓN</strong></th>
              <th className="text-right py-1"><strong>TOTAL</strong></th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-1"><strong>{item.cantidad} x</strong></td>
                <td className="py-1">{item.nombre}</td>
                <td className="text-right py-1"><strong>S/ {item.precio.toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black pt-2 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span><strong>OP. GRAVADA</strong></span>
            <span>S/ {(order.total / 1.18).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span><strong>IGV (18%)</strong></span>
            <span>S/ {(order.total - (order.total / 1.18)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-sm pt-1 border-t border-black border-double">
            <span><strong>TOTAL A PAGAR</strong></span>
            <span><strong>S/ {order.total.toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="text-center mt-6 text-[9px]">
          <p><strong>¡Gracias por su preferencia!</strong></p>
          <p>www.mrpepe.com.pe</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router  = useRouter();
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);
  const metrics = useDayMetrics();
  const { orders, loading: ordersLoading } = useRecentOrders(8);
  const { mesas } = useMesas();
  
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const occupied  = mesas.filter((m: Mesa) => m.status === "ocupada").length;
  const free      = mesas.filter((m: Mesa) => m.status === "libre").length;
  const reserved  = mesas.filter((m: Mesa) => m.status === "reservada").length;
  const total     = mesas.length || 40;

  return (
    <div className="space-y-7">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <KpiCard
          label="Ventas del día"
          value={`S/ ${metrics.totalSales.toFixed(2)}`}
          sub="Total facturado hoy"
          icon="payments"
          accent="#1A8952"
          progress={(metrics.totalSales / 5000) * 100}
        />
        <KpiCard
          label="Pedidos hoy"
          value={String(metrics.totalOrders)}
          sub="Órdenes registradas"
          icon="restaurant_menu"
          accent="#BF391B"
          progress={(metrics.totalOrders / 50) * 100}
        />
        <KpiCard
          label="Mesas ocupadas"
          value={`${occupied} / ${total}`}
          sub={`${free} mesas disponibles`}
          icon="grid_view"
          accent="#1A6FBF"
          progress={(occupied / Math.max(total, 1)) * 100}
        />
        <KpiCard
          label="Ticket promedio"
          value={`S/ ${metrics.averageTicket.toFixed(2)}`}
          sub="Por orden promedio"
          icon="trending_up"
          accent="#7B4FBF"
          progress={(metrics.averageTicket / 150) * 100}
        />
        <KpiCard
          label="Tiempo de atención"
          value={`${metrics.averagePrepTime} min`}
          sub="Promedio de preparación"
          icon="schedule"
          accent="#E57A18"
          progress={(metrics.averagePrepTime / 30) * 100}
        />
      </div>

      {/* Body: orders + side */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-8 bg-white rounded-[14px] border border-stone-100/60 card-shadow overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-stone-50">
            <div>
              <h3 className="text-[15px] font-extrabold text-[#0D0D0D]">Pedidos Recientes</h3>
              <p className="text-xs text-[#9AA0A6] font-medium mt-0.5">Últimas actualizaciones en tiempo real</p>
            </div>
            <button
              onClick={() => router.push("/pedidos")}
              className="text-xs font-bold text-[#BF391B] hover:underline"
            >
              Ver todo →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest">
                  <th className="px-5 py-3">Mesa</th>
                  <th className="px-5 py-3">Tiempo</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-stone-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <span className="material-symbols-outlined text-4xl text-stone-200 block mb-2">receipt_long</span>
                      <p className="text-[#9AA0A6] text-sm">No hay pedidos registrados hoy</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o: Order) => <OrderRow key={o.id} order={o} onAttend={(mesaNum) => setSelectedMesa(mesaNum)} />)
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side column */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Estado del Salón */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-100/60 card-shadow">
            <h3 className="text-[15px] font-extrabold text-[#0D0D0D] mb-6">Estado del Salón</h3>
            <div className="space-y-5">
              <StatusBar label="Ocupadas" count={occupied}  total={total} color="#BF391B" />
              <StatusBar label="Libres"   count={free}      total={total} color="#1A8952" />
              <StatusBar label="Reservadas" count={reserved} total={total} color="#1A6FBF" />
            </div>

            {occupied > 0 && (
              <div className="mt-6 p-3.5 bg-[#F0F2F5] rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[#BF391B] text-[18px] mt-0.5">info</span>
                <p className="text-xs text-[#5A413B] leading-relaxed">
                  <span className="font-bold">{occupied} mesas</span> con clientes activos ahora mismo.
                </p>
              </div>
            )}
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-100/60 card-shadow">
            <h3 className="text-[15px] font-extrabold text-[#0D0D0D] mb-4">Accesos Rápidos</h3>
            <div className="flex flex-col gap-2.5">
              <QuickAction
                icon="add_circle"
                label="Nueva Orden"
                sub="Comenzar un nuevo pedido"
                onClick={() => {
                  const num = prompt("Ingrese el número de mesa a atender:");
                  if (num) {
                    const mesaNum = parseInt(num);
                    if (!isNaN(mesaNum) && mesaNum > 0 && mesaNum <= 100) {
                      setSelectedMesa(mesaNum);
                    } else {
                      alert("Número de mesa inválido.");
                    }
                  }
                }}
              />
              <QuickAction
                icon="tv"
                label="Kitchen Display"
                sub="Visualizar en TV / pantalla"
                onClick={() => window.open("/kitchen-display", "_blank")}
              />
              <QuickAction
                icon="auto_graph"
                label="Ver Reportes"
                sub="Análisis de ventas"
                onClick={() => router.push("/reportes")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          const num = prompt("Ingrese el número de mesa a atender:");
          if (num) {
            const mesaNum = parseInt(num);
            if (!isNaN(mesaNum) && mesaNum > 0 && mesaNum <= 100) {
              setSelectedMesa(mesaNum);
            } else {
              alert("Número de mesa inválido.");
            }
          }
        }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center text-white ember-gradient ember-shadow hover:scale-110 active:scale-95 transition-all z-50 no-print"
        title="Nueva orden"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Ticket Invisible (Solo se ve al imprimir) */}
      <PrintTicket order={orderToPrint} />

      {/* Table Order Modal */}
      {selectedMesa !== null && (
        <TableOrderModal
          mesaNumero={selectedMesa}
          onClose={() => setSelectedMesa(null)}
        />
      )}
    </div>
  );
}
