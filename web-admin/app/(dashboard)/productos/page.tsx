"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  isDestacado: boolean;
}

interface CategoriaDoc {
  id: string;
  label: string;
  icon: string;
  colors: string[];
  emoji: string;
}

const DEFAULT_EMOJIS = [
  { e: "🔥", i: "local_fire_department", c: ["#E53935", "#FF7043"] },
  { e: "🍗", i: "lunch_dining", c: ["#F9A825", "#FFCC02"] },
  { e: "🍖", i: "restaurant", c: ["#E91E63", "#FF6090"] },
  { e: "🥤", i: "local_cafe", c: ["#1E88E5", "#42A5F5"] },
  { e: "🍛", i: "dinner_dining", c: ["#2E7D32", "#66BB6A"] },
  { e: "🎁", i: "inventory_2", c: ["#E64A19", "#FF8A65"] },
  { e: "🍰", i: "cake", c: ["#8E24AA", "#CE93D8"] },
  { e: "🥗", i: "eco", c: ["#43A047", "#A5D6A7"] },
];

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categories, setCategories] = useState<CategoriaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modal / Form State
  const [isOpen, setIsOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Fields
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("parrillas");
  const [isDestacado, setIsDestacado] = useState(false);

  // New Category Form Fields
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🔥");
  const [newCatIcon, setNewCatIcon] = useState("local_fire_department");
  const [newCatColors, setNewCatColors] = useState<string[]>(["#E53935", "#FF7043"]);

  // Load categories and products in real-time
  useEffect(() => {
    // 1. Categories
    const unsubCats = onSnapshot(collection(db, "categories"), async (snapshot) => {
      if (snapshot.empty) {
        // Auto seed
        const defaults = [
          { id: "parrillas", label: "Parrillas", icon: "local_fire_department", colors: ["#E53935", "#FF7043"], emoji: "🔥" },
          { id: "broaster", label: "Broaster", icon: "lunch_dining", colors: ["#F9A825", "#FFCC02"], emoji: "🍗" },
          { id: "piqueos", label: "Piqueos", icon: "restaurant", colors: ["#E91E63", "#FF6090"], emoji: "🍖" },
          { id: "bebidas", label: "Bebidas", icon: "local_cafe", colors: ["#1E88E5", "#42A5F5"], emoji: "🥤" },
          { id: "extras", label: "Extras", icon: "dinner_dining", colors: ["#2E7D32", "#66BB6A"], emoji: "🍛" },
          { id: "combos", label: "Combos", icon: "inventory_2", colors: ["#E64A19", "#FF8A65"], emoji: "🎁" },
          { id: "postres", label: "Postres", icon: "cake", colors: ["#8E24AA", "#CE93D8"], emoji: "🍰" },
          { id: "ensaladas", label: "Ensaladas", icon: "eco", colors: ["#43A047", "#A5D6A7"], emoji: "🥗" }
        ];
        for (const cat of defaults) {
          await setDoc(doc(db, "categories", cat.id), cat);
        }
        return;
      }
      const loaded: CategoriaDoc[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          label: data.label || "",
          icon: data.icon || "fastfood",
          colors: data.colors || ["#424242", "#757575"],
          emoji: data.emoji || "🍔"
        });
      });
      loaded.sort((a, b) => a.label.localeCompare(b.label));
      setCategories(loaded);
    });

    // 2. Products
    const q = query(collection(db, "products"), orderBy("nombre", "asc"));
    const unsubProds = onSnapshot(q, (snapshot) => {
      const docs: Producto[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          precio: Number(data.precio) || 0,
          categoria: data.categoria || "parrillas",
          imagen: data.imagen || "",
          isDestacado: !!data.isDestacado,
        });
      });
      setProductos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products from Firestore:", error);
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoria(categories[0]?.id || "parrillas");
    setIsDestacado(false);
    setIsOpen(true);
  };

  const openEditModal = (producto: Producto) => {
    setEditingId(producto.id);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio.toString());
    setCategoria(producto.categoria);
    setIsDestacado(producto.isDestacado);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio) {
      alert("Por favor complete los campos obligatorios (Nombre, Precio).");
      return;
    }

    const productData = {
      nombre,
      descripcion,
      precio: parseFloat(precio) || 0,
      categoria: categoria.toLowerCase(),
      imagen: "",
      isDestacado,
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date(),
        });
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Ocurrió un error al guardar el producto.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCatLabel.trim();
    if (!label) return;

    const id = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
    try {
      await setDoc(doc(db, "categories", id), {
        label,
        emoji: newCatEmoji,
        icon: newCatIcon,
        colors: newCatColors
      });
      setCategoria(id);
      setIsCatModalOpen(false);
      setNewCatLabel("");
    } catch (error) {
      console.error("Error creating category:", error);
      alert("No se pudo crear la categoría.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de que desea eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Ocurrió un error al eliminar el producto.");
      }
    }
  };

  // Filtering
  const filteredProducts = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[14px] border border-stone-100/60 card-shadow">
        <div>
          <h1 className="text-xl font-bold text-[#0D0D0D]">Gestión de Carta & Inventario</h1>
          <p className="text-xs text-[#9AA0A6] mt-1">Crea, edita y administra los productos de tu menú. Sincronizado en tiempo real con la App móvil.</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#E94E1B] hover:bg-[#D33D0D] text-white font-semibold px-4 py-2.5 rounded-[10px] transition-all text-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nuevo Producto
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-[10px] border border-stone-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[#0D0D0D] text-white"
                : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/50"
            }`}
          >
            TODOS ({productos.length})
          </button>
          {categories.map((cat) => {
            const count = productos.filter((p) => p.categoria === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-[#0D0D0D] text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/50"
                }`}
              >
                {cat.emoji} {cat.label.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-stone-100/60 h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-stone-100/60 p-16 text-center card-shadow">
          <span className="material-symbols-outlined text-5xl text-stone-300 block mb-3">folder_open</span>
          <h3 className="text-base font-bold text-[#0D0D0D]">No se encontraron productos</h3>
          <p className="text-sm text-[#9AA0A6] mt-1">Intente cambiar el filtro de categoría o su búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const catDoc = categories.find((c) => c.id === p.categoria) || {
              emoji: "🍔",
              icon: "fastfood",
              colors: ["#757575", "#9e9e9e"],
              label: p.categoria
            };
            return (
              <div 
                key={p.id} 
                className="bg-white rounded-[14px] border border-stone-100/60 overflow-hidden card-shadow flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-stone-200"
              >
                {/* Category Icon & Badges */}
                <div 
                  className="h-40 relative overflow-hidden flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${catDoc.colors[0]}18, ${catDoc.colors[1]}10)`,
                    borderTopLeftRadius: '13px',
                    borderTopRightRadius: '13px',
                  }}
                >
                  <span 
                    className="material-symbols-outlined animate-none" 
                    style={{ 
                      fontSize: '52px', 
                      color: catDoc.colors[0] + '90',
                    }}
                  >
                    {catDoc.icon}
                  </span>
                  
                  {/* Category Badge */}
                  <span 
                    className="absolute top-3 left-3 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase"
                    style={{ background: catDoc.colors[0] + 'E6' }}
                  >
                    {catDoc.emoji} {catDoc.label}
                  </span>

                  {/* Featured Badge */}
                  {p.isDestacado && (
                    <span className="absolute top-3 right-3 bg-[#E94E1B] text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                      ⭐ Destacado
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#0D0D0D] text-sm line-clamp-1">{p.nombre}</h3>
                  <p className="text-xs text-[#9AA0A6] mt-1 line-clamp-2 flex-1">{p.descripcion || "Sin descripción."}</p>
                  
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#9AA0A6] block">Precio</span>
                      <span className="text-base font-extrabold text-[#E94E1B]">S/ {p.precio.toFixed(2)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="w-8 h-8 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center justify-center transition-all"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-8 h-8 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 flex items-center justify-center transition-all"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-base font-bold text-[#0D0D0D]">
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-stone-400 hover:text-stone-600 material-symbols-outlined"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Pollo a la Brasa 1/4"
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    if (e.target.value === "CREATE_NEW") {
                      setIsCatModalOpen(true);
                    } else {
                      setCategoria(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                  ))}
                  <option value="CREATE_NEW" className="text-[#E94E1B] font-bold">＋ Nueva categoría...</option>
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Precio (S/) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="25.50"
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                />
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Cantidad / Stock *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="100"
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                />
              </div>

              {/* Descripcion */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalla los ingredientes o acompañamientos..."
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                />
              </div>

              {/* Destacado */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDestacado"
                  checked={isDestacado}
                  onChange={(e) => setIsDestacado(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E94E1B] focus:ring-[#E94E1B]"
                />
                <label htmlFor="isDestacado" className="text-xs font-semibold text-stone-700 select-none cursor-pointer">
                  Destacar este producto en la carta digital
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-semibold rounded-lg hover:bg-stone-50 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E94E1B] hover:bg-[#D33D0D] text-white font-semibold rounded-lg transition-all text-sm"
                >
                  {editingId ? "Guardar Cambios" : "Agregar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal Create Category */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[14px] p-6 w-full max-w-sm card-shadow animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-[#0D0D0D] mb-4">Nueva Categoría</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="Ej. Pastas"
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Icono / Estilo</label>
                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {DEFAULT_EMOJIS.map((item) => {
                    const isSel = newCatEmoji === item.e;
                    return (
                      <button
                        key={item.e}
                        type="button"
                        onClick={() => {
                          setNewCatEmoji(item.e);
                          setNewCatIcon(item.i);
                          setNewCatColors(item.c);
                        }}
                        className={`h-11 rounded-lg flex items-center justify-center text-lg border transition-all ${
                          isSel ? "border-black bg-stone-50 scale-105" : "border-stone-200/60 hover:bg-stone-50"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${item.c[0]}15, ${item.c[1]}08)`
                        }}
                      >
                        {item.e}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-2 border border-stone-200 text-stone-600 font-semibold rounded-lg text-sm hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#E94E1B] text-white font-semibold rounded-lg text-sm hover:bg-[#D33D0D]"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
