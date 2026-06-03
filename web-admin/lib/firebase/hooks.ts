"use client";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";

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
}

// ── Hook: Recent Orders ───────────────────────────────────────────────────────

export function useRecentOrders(limitCount = 8) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            mesaNumero: data.mesaNumero ?? 0,
            items: data.items ?? [],
            total: data.total ?? 0,
            status: data.status ?? "pendiente",
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt ?? Date.now()),
            printed: data.printed ?? false,
          } as Order;
        })
      );
      setLoading(false);
    });

    return unsub;
  }, [limitCount]);

  return { orders, loading };
}

// ── Hook: All Active Orders (for kitchen display) ─────────────────────────────

export function useActiveOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Quitamos orderBy para evitar errores de índices en Firestore
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pendiente", "preparando", "listo"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          mesaNumero: data.mesaNumero ?? 0,
          items: data.items ?? [],
          total: data.total ?? 0,
          status: data.status ?? "pendiente",
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt ?? Date.now()),
        } as Order;
      });
      
      // Ordenamos en el cliente por hora de creación
      list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      setOrders(list);
      setLoading(false);
    }, (error) => {
      console.error("Error en Cocina:", error);
    });

    return unsub;
  }, []);

  return { orders, loading };
}

// ── Hook: Mesas ───────────────────────────────────────────────────────────────

export function useMesas() {
  const [mesas, setMesas]     = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cambiamos a 'tables' que es el nombre que usa tu App Flutter
    const unsub = onSnapshot(collection(db, "tables"), (snap) => {
      setMesas(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            // Soporte para ambos nombres de campo
            numero: data.numero ?? data.mesaNumero ?? 0,
            status: data.status ?? "libre",
            capacidad: data.capacidad ?? 4,
          } as Mesa;
        })
      );
      setLoading(false);
    }, (error) => {
      console.error("Error cargando mesas:", error);
    });
    return unsub;
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

    setMetrics({
      totalSales,
      totalOrders,
      averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      occupiedTables: mesas.filter((m) => m.status === "ocupada").length,
      totalTables:    mesas.length,
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

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(from)),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            mesaNumero: data.mesaNumero ?? 0,
            items: data.items ?? [],
            total: data.total ?? 0,
            status: data.status ?? "pendiente",
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
          } as Order;
        })
      );
      setLoading(false);
    });

    return unsub;
  }, [period]);

  return { orders, loading };
}

// ── Hook: Billing Orders (Paid orders) ────────────────────────────────────────

export function useBillingOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pagado", "entregado"]),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          mesaNumero: data.mesaNumero ?? 0,
          items: data.items ?? [],
          total: data.total ?? 0,
          status: data.status ?? "pendiente",
          clienteNombre: data.clienteNombre,
          clienteDocumento: data.clienteDocumento,
          tipoDocumento: data.tipoDocumento ?? "boleta",
          voucherNumber: data.voucherNumber,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(),
        } as Order;
      });

      // Ordenamos localmente para evitar error de índice
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setOrders(list);
      setLoading(false);
    }, (error) => {
      console.error("Error en Facturación:", error);
    });

    return unsub;
  }, []);

  return { orders, loading };
}
