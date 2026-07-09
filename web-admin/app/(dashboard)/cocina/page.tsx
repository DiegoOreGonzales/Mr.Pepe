"use client";

import { useEffect, useState } from "react";
import { useActiveOrders, Order } from "@/lib/firebase/hooks";

function minutesSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

function timerColor(mins: number): string {
  if (mins < 10) return "#1A8952";
  if (mins < 20) return "#F59E0B";
  return "#BF391B";
}

async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: newStatus })
    });
    const json = await res.json();
    return json.success;
  } catch (e) {
    console.error("Error updating order status:", e);
    return false;
  }
}

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, nextStatus: string) => void }) {
  const [mins, setMins] = useState(minutesSince(order.createdAt));
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => { 
      setMins(minutesSince(order.createdAt)); 
    }, 30000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  const handleAction = async () => {
    if (actionLoading) return;
    let nextStatus = "";
    if (order.status === "pendiente") nextStatus = "preparando";
    else if (order.status === "preparando") nextStatus = "listo";
    else if (order.status === "listo") nextStatus = "entregado";

    if (!nextStatus) return;

    // Optimistic UI update
    const previousStatus = order.status;
    onStatusChange(order.id, nextStatus);

    setActionLoading(true);
    try {
      const success = await updateOrderStatus(order.id, nextStatus);
      if (!success) {
        // Rollback on failure
        onStatusChange(order.id, previousStatus);
        alert("Error al actualizar el estado del pedido.");
      }
    } catch (e) {
      console.error(e);
      // Rollback on failure
      onStatusChange(order.id, previousStatus);
    } finally {
      setActionLoading(false);
    }
  };

  const color = timerColor(mins);

  let btnLabel = "";
  let btnColor = "";
  if (order.status === "pendiente") {
    btnLabel = "Empezar Cocina";
    btnColor = "bg-[#F59E0B] hover:bg-[#D97706]";
  } else if (order.status === "preparando") {
    btnLabel = "Marcar como Listo";
    btnColor = "bg-[#E54D2A] hover:bg-[#C93B1C]";
  } else if (order.status === "listo") {
    btnLabel = "Marcar Entregado";
    btnColor = "bg-[#1A8952] hover:bg-[#136A3F]";
  }

  return (
    <div
      className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm flex flex-col gap-3 transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-lg text-white text-[10px] font-extrabold bg-[#BF391B]"
          >
            Mesa {order.mesaNumero}
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: color + "15" }}
        >
          <span className="material-symbols-outlined text-[12px]" style={{ color: color }}>timer</span>
          <span className="text-[10px] font-extrabold" style={{ color: color }}>{mins} min</span>
        </div>
      </div>

      <div className="space-y-1.5 flex-1">
        {order.items && order.items.length > 0 ? (
          order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded bg-[#BF391B]/10 text-[#BF391B] text-[9px] font-extrabold flex items-center justify-center"
              >
                {item.cantidad}x
              </span>
              <span className="text-stone-700 text-xs font-semibold truncate">{item.nombre}</span>
            </div>
          ))
        ) : (
          <p className="text-stone-400 text-xs italic">Sin detalle de items</p>
        )}
      </div>

      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
        <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Total</span>
        <span className="text-[#0D0D0D] font-extrabold text-xs">S/ {order.total.toFixed(2)}</span>
      </div>

      {btnLabel && (
        <button
          onClick={handleAction}
          disabled={actionLoading}
          className={`w-full py-2 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${btnColor}`}
        >
          {actionLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-[14px]">
                {order.status === "pendiente" ? "play_arrow" : order.status === "preparando" ? "done" : "sports_motorsports"}
              </span>
              {btnLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function CocinaPage() {
  const { orders, loading } = useActiveOrders();
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (orders.length > 0 || !loading) {
      setLocalOrders(orders);
    }
  }, [orders, loading]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setLocalOrders((prev) => {
      // If status is entregado, remove from display, else update status
      if (newStatus === "entregado") {
        return prev.filter((o) => o.id !== orderId);
      }
      return prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o));
    });
  };

  const pending   = localOrders.filter((o) => o.status === "pendiente");
  const inProcess = localOrders.filter((o) => o.status === "preparando");
  const ready     = localOrders.filter((o) => o.status === "listo");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#BF391B] tracking-tight">Panel de Cocina</h1>
          <p className="text-xs text-[#9AA0A6] font-medium mt-0.5">Seguimiento e interacción con comandas activas</p>
        </div>
        <a
          href="/kitchen-display"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">tv</span>
          Pantalla Completa TV
        </a>
      </div>

      {loading && localOrders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-stone-100 animate-pulse h-96" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-[calc(100vh-200px)] overflow-hidden">
          {/* Column 1: Pendientes */}
          <div className="flex flex-col h-full bg-[#F8F9FA] rounded-2xl p-4 border border-stone-200/50">
            <div className="flex items-center justify-between mb-4 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700">
              <span className="text-xs font-black uppercase tracking-wider">Pendientes</span>
              <span className="text-xs font-black">{pending.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {pending.map((o) => (
                <OrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />
              ))}
              {pending.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-xs">Sin pedidos pendientes</div>
              )}
            </div>
          </div>

          {/* Column 2: En Proceso */}
          <div className="flex flex-col h-full bg-[#F8F9FA] rounded-2xl p-4 border border-stone-200/50">
            <div className="flex items-center justify-between mb-4 px-3 py-1.5 rounded-lg bg-orange-600/10 text-orange-700">
              <span className="text-xs font-black uppercase tracking-wider">En Proceso</span>
              <span className="text-xs font-black">{inProcess.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {inProcess.map((o) => (
                <OrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />
              ))}
              {inProcess.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-xs">Sin pedidos en proceso</div>
              )}
            </div>
          </div>

          {/* Column 3: Listos */}
          <div className="flex flex-col h-full bg-[#F8F9FA] rounded-2xl p-4 border border-stone-200/50">
            <div className="flex items-center justify-between mb-4 px-3 py-1.5 rounded-lg bg-green-600/10 text-green-700">
              <span className="text-xs font-black uppercase tracking-wider">Listos</span>
              <span className="text-xs font-black">{ready.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {ready.map((o) => (
                <OrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />
              ))}
              {ready.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-xs">Sin pedidos listos</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
