"use client";

import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface Order {
  id: string;
  mesaNumero: number;
  items: OrderItem[];
  total: number;
  status: "pendiente" | "preparando" | "listo" | "entregado" | "pagado";
  clienteNombre?: string;
  clienteDocumento?: string;
  tipoDocumento?: "boleta" | "factura";
  createdAt: Date;
  printed?: boolean;
  voucherNumber?: string;
  updatedAt?: Date;
}

export interface Mesa {
  id: string;
  numero: number;
  status: "libre" | "ocupada" | "reservada";
  capacidad?: number;
}

export interface DayMetrics {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  occupiedTables: number;
  totalTables: number;
  averagePrepTime: number;
}

// Helper to parse dates safely
function parseDate(d: any): Date {
  return d ? new Date(d) : new Date();
}

// ── Hook: Recent Orders ───────────────────────────────────────────────────────

export function useRecentOrders(limitCount = 8) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch(`/api/orders?limit=${limitCount}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(
            json.data.map((o: any) => ({
              ...o,
              createdAt: parseDate(o.createdAt),
              updatedAt: parseDate(o.updatedAt),
            }))
          );
        }
      } catch (e) {
        console.error("Error in useRecentOrders:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchRecent();
    const interval = setInterval(fetchRecent, 3000);
    return () => clearInterval(interval);
  }, [limitCount]);

  return { orders, loading };
}

// ── Hook: All Active Orders (for kitchen display) ─────────────────────────────

export function useActiveOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch(`/api/orders?status=active`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(
            json.data.map((o: any) => ({
              ...o,
              createdAt: parseDate(o.createdAt),
              updatedAt: parseDate(o.updatedAt),
            }))
          );
        }
      } catch (e) {
        console.error("Error in useActiveOrders:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchActive();
    const interval = setInterval(fetchActive, 1200);
    return () => clearInterval(interval);
  }, []);

  return { orders, loading };
}

// ── Hook: Mesas ───────────────────────────────────────────────────────────────

export function useMesas() {
  const [mesas, setMesas]     = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMesas() {
      try {
        const res = await fetch("/api/tables");
        const json = await res.json();
        if (json.success && json.data) {
          setMesas(json.data);
        }
      } catch (e) {
        console.error("Error loading mesas:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchMesas();
    const interval = setInterval(fetchMesas, 3000);
    return () => clearInterval(interval);
  }, []);

  return { mesas, loading };
}

// ── Hook: Day Metrics ─────────────────────────────────────────────────────────

export function useDayMetrics() {
  const [metrics, setMetrics] = useState<DayMetrics>({
    totalSales:     0,
    totalOrders:    0,
    averageTicket:  0,
    occupiedTables: 0,
    totalTables:    0,
    averagePrepTime: 0,
  });

  const { orders } = useRecentOrders(500);
  const { mesas }  = useMesas();

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (o) => o.createdAt >= today && o.status !== "pendiente"
    );

    const totalSales  = todayOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = todayOrders.length;

    // Calcular tiempo de preparación promedio (en minutos)
    const completedOrders = todayOrders.filter(
      (o) => ["listo", "entregado", "pagado"].includes(o.status)
    );
    let totalPrepMs = 0;
    completedOrders.forEach((o) => {
      const created = new Date(o.createdAt);
      const updated = new Date(o.updatedAt || o.createdAt);
      totalPrepMs += (updated.getTime() - created.getTime());
    });
    const averagePrepTime = completedOrders.length > 0
      ? Math.round((totalPrepMs / completedOrders.length) / 60000)
      : 0;

    setMetrics({
      totalSales,
      totalOrders,
      averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      occupiedTables: mesas.filter((m) => m.status === "ocupada").length,
      totalTables:    mesas.length,
      averagePrepTime,
    });
  }, [orders, mesas]);

  return metrics;
}

// ── Hook: Report Orders (with period filter) ──────────────────────────────────

export type ReportPeriod = "hoy" | "semana" | "mes";

export function useReportOrders(period: ReportPeriod) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/orders?status=billing`); // Obtenemos las órdenes cobradas
        const json = await res.json();
        if (json.success && json.data) {
          const now  = new Date();
          const from = new Date();

          if (period === "hoy") {
            from.setHours(0, 0, 0, 0);
          } else if (period === "semana") {
            from.setDate(now.getDate() - 7);
            from.setHours(0, 0, 0, 0);
          } else {
            from.setDate(1);
            from.setHours(0, 0, 0, 0);
          }

          const parsed = json.data.map((o: any) => ({
            ...o,
            createdAt: parseDate(o.createdAt),
          }));

          const filtered = parsed.filter((o: any) => o.createdAt >= from);
          setOrders(filtered);
        }
      } catch (e) {
        console.error("Error in useReportOrders:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
    const interval = setInterval(fetchReport, 5000);
    return () => clearInterval(interval);
  }, [period]);

  return { orders, loading };
}

// ── Hook: Billing Orders (Paid orders) ────────────────────────────────────────

export function useBillingOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/orders?status=billing");
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(
            json.data.map((o: any) => ({
              ...o,
              createdAt: parseDate(o.createdAt),
            }))
          );
        }
      } catch (e) {
        console.error("Error in useBillingOrders:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchBilling();
    const interval = setInterval(fetchBilling, 3000);
    return () => clearInterval(interval);
  }, []);

  return { orders, loading };
}
