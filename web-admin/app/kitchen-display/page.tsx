"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/firebase/auth-context";
import { useActiveOrders, Order } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/config";

function minutesSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

function timerColor(mins: number): string {
  if (mins < 10) return "#1A8952";
  if (mins < 20) return "#F59E0B";
  return "#BF391B";
}

function OrderCard({ order }: { order: Order }) {
  const [mins, setMins] = useState(minutesSince(order.createdAt));

  useEffect(() => {
    var t = setInterval(function() { 
      setMins(minutesSince(order.createdAt)); 
    }, 30000);
    return function() { clearInterval(t); };
  }, [order.createdAt]);

  var color = timerColor(mins);

  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-3"
      style={{ background: "#1A1A1A", borderColor: "rgba(228,231,236,0.08)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-lg text-white text-xs font-extrabold"
            style={{ background: "#BF391B" }}
          >
            Mesa {order.mesaNumero}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: color + "20" }}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ color: color }}>timer</span>
          <span className="text-[11px] font-extrabold" style={{ color: color }}>{mins} min</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {order.items && order.items.length > 0 ? (
          order.items.map(function(item, i) {
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold flex-shrink-0"
                  style={{ background: "#BF391B", color: "#fff" }}
                >
                  {item.cantidad}×
                </span>
                <span className="text-stone-200 text-xs font-medium truncate">{item.nombre}</span>
              </div>
            );
          })
        ) : (
          <p className="text-stone-500 text-xs italic">Sin detalle de items</p>
        )}
      </div>

      <div className="pt-2 border-t border-stone-700/50 flex items-center justify-between">
        <span className="text-stone-500 text-[10px] font-semibold uppercase tracking-wider">Total</span>
        <span className="text-white font-extrabold text-sm">S/ {order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function KitchenDisplayContent() {
  const { login, user } = useAuth();
  // Solo activamos el hook si el usuario ya está logueado
  const { orders, loading } = useActiveOrders();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  // Forzar Long Polling para TVs antiguas (WebOS 3.0)
  useEffect(() => {
    try {
      (db as any)._settings.experimentalForceLongPolling = true;
      console.log("Forzando Long Polling...");
    } catch(e) {}
  }, []);

  // Auto-login silencioso
  useEffect(() => {
    if (!user) {
      login("admin@chioschicken.com", "admin123456")
        .then(function() { console.log("✅ Autenticado"); })
        .catch(function(e) { console.error("❌ Login error:", e); });
    }
  }, [user, login]);

  useEffect(() => {
    setMounted(true);
    var t = setInterval(function() { 
      setNow(new Date()); 
    }, 30000);
    return function() { clearInterval(t); };
  }, []);

  // Si no está montado o no hay usuario, mostramos carga
  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#BF391B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Iniciando Sistema...</p>
        {!user && <p className="text-stone-700 text-[8px] mt-2">Conectando a base de datos segura</p>}
      </div>
    );
  }

  const pending   = orders.filter(function(o) { return o.status === "pendiente"; });
  const inProcess = orders.filter(function(o) { return o.status === "preparando"; });
  const ready     = orders.filter(function(o) { return o.status === "listo"; });

  var timeStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  var dateStr = now.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "#0D0D0D", color: "#fff" }}>
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">CHIO'S CHICKEN</h1>
            <p className="text-[10px] font-bold text-[#BF391B] uppercase tracking-[0.2em]">Kitchen Display</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1A8952] animate-pulse" />
            <span className="text-[11px] font-bold text-[#1A8952] uppercase tracking-wider">En vivo</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">{timeStr}</p>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider capitalize">{dateStr}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-5 p-6 overflow-auto">
        <div>
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-[#F59E0B]/10">
            <h2 className="text-[11px] font-black text-[#F59E0B] uppercase tracking-widest">Pendientes ({pending.length})</h2>
          </div>
          <div className="space-y-3">
             {pending.map(function(o) { return <OrderCard key={o.id} order={o} />; })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-[#BF391B]/10">
            <h2 className="text-[11px] font-black text-[#E54D2A] uppercase tracking-widest">En Proceso ({inProcess.length})</h2>
          </div>
          <div className="space-y-3">
             {inProcess.map(function(o) { return <OrderCard key={o.id} order={o} />; })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-[#1A8952]/10">
            <h2 className="text-[11px] font-black text-[#1A8952] uppercase tracking-widest">Listos ({ready.length})</h2>
          </div>
          <div className="space-y-3">
             {ready.map(function(o) { return <OrderCard key={o.id} order={o} />; })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KitchenDisplayPage() {
  return (
    <AuthProvider>
      <KitchenDisplayContent />
    </AuthProvider>
  );
}
