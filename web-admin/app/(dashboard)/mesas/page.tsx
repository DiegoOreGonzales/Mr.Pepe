"use client";
import { useMesas, Mesa } from "@/lib/firebase/hooks";

const STATUS_COLOR: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  libre:     { bg: "#1A895210", border: "#1A895240", dot: "#1A8952", label: "Libre"     },
  ocupada:   { bg: "#BF391B10", border: "#BF391B40", dot: "#BF391B", label: "Ocupada"   },
  reservada: { bg: "#1A6FBF10", border: "#1A6FBF40", dot: "#1A6FBF", label: "Reservada" },
};

export default function MesasPage() {
  const { mesas, loading } = useMesas();

  // Fill to 40 if Firestore has fewer
  const grid: (Mesa | null)[] = Array.from({ length: 40 }, (_, i) => {
    return mesas.find((m) => m.numero === i + 1) ?? null;
  });

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_COLOR).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.dot }} />
            <span className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">{v.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
          {grid.map((mesa, i) => {
            const num    = i + 1;
            const status = mesa?.status ?? "libre";
            const style  = STATUS_COLOR[status];
            return (
              <div
                key={i}
                className="rounded-[14px] p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-105"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  minHeight: "72px",
                }}
              >
                <p className="text-lg font-extrabold text-[#0D0D0D]">{num}</p>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ color: style.dot, background: style.dot + "20" }}
                >
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
