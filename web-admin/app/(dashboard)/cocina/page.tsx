export default function CocinaPage() {
  return (
    <div className="bg-white rounded-[14px] border border-stone-100/60 card-shadow p-12 text-center">
      <span className="material-symbols-outlined text-5xl text-stone-200 block mb-3">kitchen</span>
      <h2 className="text-lg font-bold text-[#0D0D0D] mb-2">Panel de Cocina</h2>
      <p className="text-sm text-[#9AA0A6] mb-6">La vista optimizada para cocina está disponible en pantalla completa.</p>
      <a
        href="/kitchen-display"
        target="_blank"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-white text-sm font-bold ember-gradient ember-shadow hover:brightness-110 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">tv</span>
        Abrir Kitchen Display (para TV)
      </a>
    </div>
  );
}
