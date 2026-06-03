"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";

const navItems = [
  { href: "/dashboard",    icon: "dashboard",    label: "Dashboard"    },
  { href: "/mesas",        icon: "restaurant",   label: "Mesas"        },
  { href: "/cocina",       icon: "kitchen",      label: "Cocina"       },
  { href: "/pedidos",      icon: "receipt_long", label: "Pedidos"      },
  { href: "/facturacion",  icon: "receipt",      label: "Facturación"  },
  { href: "/reportes",     icon: "analytics",    label: "Reportes"     },
  { href: "/productos",    icon: "inventory_2",  label: "Productos"    },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col py-8 z-50 shadow-2xl"
      style={{ background: "linear-gradient(to bottom, #111111 0%, #1A1A1A 100%)" }}
    >
      {/* Brand */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1
            className="text-xl font-extrabold tracking-tighter text-white uppercase"
            style={{ letterSpacing: "-0.02em" }}
          >
            Mr. Pepe
          </h1>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest ml-11"
          style={{ color: "#9AA0A6" }}>
          Admin Panel
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-0.5 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? "text-[#E54D2A] border-l-[3px] border-[#BF391B] pl-[13px]"
                  : "text-stone-400 hover:text-stone-100 hover:bg-white/5"
              }`}
              style={isActive ? { background: "rgba(191,57,27,0.12)" } : {}}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Kitchen Display shortcut */}
      <div className="px-4 mb-4">
        <Link
          href="/kitchen-display"
          target="_blank"
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border border-[#BF391B]/30 text-[#E54D2A] hover:bg-[#BF391B]/10"
        >
          <span className="material-symbols-outlined text-base">tv</span>
          Kitchen Display (TV)
        </Link>
      </div>

      {/* User + logout */}
      <div className="px-4 border-t border-stone-800 pt-5">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full ember-gradient flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm">person</span>
          </div>
          <div className="min-w-0">
            <p className="text-stone-200 text-xs font-bold truncate">
              {user?.email?.split("@")[0] ?? "Admin"}
            </p>
            <p className="text-stone-500 text-[10px] uppercase font-semibold">
              Administrador
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-all duration-200 text-xs font-semibold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
