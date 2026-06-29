"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useRecentOrders, Order } from "@/lib/firebase/hooks";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":   { title: "Resumen del día",         subtitle: "Vista general de operaciones" },
  "/mesas":       { title: "Gestión de Mesas",         subtitle: "Estado en tiempo real del salón" },
  "/cocina":      { title: "Panel de Cocina",           subtitle: "Seguimiento de comandas activas" },
  "/pedidos":     { title: "Pedidos",                  subtitle: "Historial y gestión de órdenes" },
  "/facturacion": { title: "Facturación",              subtitle: "Cierres de cuenta y boletas" },
  "/reportes":    { title: "Análisis de Operaciones",  subtitle: "KPIs y métricas de negocio" },
  "/productos":   { title: "Gestión de Productos",     subtitle: "Carta digital y categorías" },
};

function getTodayLabel() {
  const now   = new Date();
  const days  = ["DOMINGO","LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO"];
  const months = ["enero","febrero","marzo","abril","mayo","junio",
                  "julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

export default function TopBar() {
  const pathname = usePathname();
  const page     = pageTitles[pathname] ?? { title: "Chio's Chicken", subtitle: "" };
  
  const [showNotifications, setShowNotifications] = useState(false);
  const { orders } = useRecentOrders(5); // Obtenemos los 5 pedidos más recientes
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 h-16 flex items-center justify-between px-8 z-40"
      style={{
        width: "calc(100% - 240px)",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(228,231,236,0.4)",
      }}
    >
      {/* Title */}
      <div>
        <h2 className="text-[20px] font-extrabold text-[#0D0D0D] leading-tight tracking-tight">
          {page.title}
        </h2>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9AA0A6]">
          {pathname === "/dashboard" ? getTodayLabel() : page.subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A8952]/10 mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A8952] animate-pulse" />
          <span className="text-[10px] font-bold text-[#1A8952] uppercase tracking-wider">En vivo</span>
        </div>

        {/* Notifications Button */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              showNotifications ? 'bg-[#BF391B] text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {orders.length > 0 && !showNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#BF391B] border-2 border-white rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden animate-fade-in">
              <div className="px-5 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                <span className="text-xs font-black text-[#0D0D0D] uppercase tracking-widest">Actividad Reciente</span>
                <span className="text-[10px] font-bold text-[#BF391B] px-2 py-0.5 bg-[#BF391B]/10 rounded-full">EN VIVO</span>
              </div>
              <div className="max-h-[350px] overflow-auto divide-y divide-stone-50">
                {orders.length === 0 ? (
                  <div className="p-10 text-center text-[#9AA0A6]">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                    <p className="text-xs font-medium">No hay actividad nueva</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="px-5 py-4 hover:bg-stone-50/80 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#BF391B]/10 text-[#BF391B] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-black">M{order.mesaNumero}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0D0D0D]">
                            Mesa {order.mesaNumero}: <span className="uppercase text-[#BF391B]">{order.status}</span>
                          </p>
                          <p className="text-[10px] text-[#9AA0A6] mt-0.5 line-clamp-1">
                            {order.items.map(i => i.nombre).join(", ")}
                          </p>
                          <p className="text-[9px] text-[#9AA0A6] mt-1 font-bold">
                            {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full py-3 text-[10px] font-black text-[#9AA0A6] hover:text-[#BF391B] uppercase tracking-widest bg-stone-50/50 transition-colors">
                Ver todo el historial
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-stone-100 mx-1" />

        {/* Print shortcut */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#BF391B] border border-[#BF391B]/20 hover:bg-[#BF391B]/5 transition-all text-[11px] font-black uppercase tracking-wider no-print"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Imprimir
        </button>
      </div>
    </header>
  );
}
