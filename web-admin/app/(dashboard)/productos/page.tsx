export default function ProductosPage() {
  return (
    <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow p-12 text-center">
      <span className="material-symbols-outlined text-5xl text-stone-200 block mb-3">inventory_2</span>
      <h2 className="text-lg font-bold text-[#0D0D0D] mb-1">Gestión de Productos</h2>
      <p className="text-sm text-[#9AA0A6]">CRUD de carta digital conectado a Firestore colección <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">products/</code>.</p>
      <p className="text-xs text-[#9AA0A6] mt-2">Los cambios se reflejan en tiempo real en la app móvil Flutter.</p>
    </div>
  );
}
