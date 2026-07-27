"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { AuthProvider } from "@/lib/firebase/auth-context";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const ROUTE_PERMISSIONS = [
  { path: "/dashboard",   roles: ["admin"] },
  { path: "/mesas",       roles: ["admin", "mesero"] },
  { path: "/cocina",      roles: ["admin", "cocina"] },
  { path: "/pedidos",     roles: ["admin", "mesero", "cocina"] },
  { path: "/facturacion", roles: ["admin", "mesero"] },
  { path: "/reportes",    roles: ["admin"] },
  { path: "/productos",   roles: ["admin"] },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else {
        const userRole = user.role || "admin";
        const matchedRoute = ROUTE_PERMISSIONS.find(
          (route) => pathname === route.path || pathname.startsWith(route.path + "/")
        );
        if (matchedRoute && !matchedRoute.roles.includes(userRole)) {
          if (userRole === "cocina") {
            router.replace("/cocina");
          } else {
            router.replace("/mesas");
          }
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl ember-gradient flex items-center justify-center animate-pulse">
            <span
              className="material-symbols-outlined text-white text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
          </div>
          <p className="text-sm font-semibold text-[#9AA0A6] uppercase tracking-widest">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="no-print">
        <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        <TopBar onToggleMenu={() => setIsMobileOpen(true)} />
      </div>
      <main className="lg:ml-[240px] ml-0 pt-16 min-h-screen print:ml-0 print:pt-0">
        <div className="p-4 sm:p-7 animate-fade-in print:p-0">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
