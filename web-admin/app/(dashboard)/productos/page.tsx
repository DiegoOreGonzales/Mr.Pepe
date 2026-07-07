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
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number; // Stock / Cantidad disponible
  categoria: string;
  imagen: string;
  isDestacado: boolean;
}

const CATEGORIES = [
  { id: "parrillas", label: "Parrillas" },
  { id: "piqueos", label: "Piqueos" },
  { id: "bebidas", label: "Bebidas" },
  { id: "guarniciones", label: "Guarniciones" },
  { id: "postres", label: "Postres" }
];

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modal / Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Fields
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [categoria, setCategoria] = useState("parrillas");
  const [imagen, setImagen] = useState("");
  const [isDestacado, setIsDestacado] = useState(false);

  // Load products in real-time
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Producto[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          precio: Number(data.precio) || 0,
          cantidad: Number(data.cantidad) || 0,
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

    return () => unsubscribe();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCantidad("");
    setCategoria("parrillas");
    setImagen("");
    setIsDestacado(false);
    setIsOpen(true);
  };

  const openEditModal = (producto: Producto) => {
    setEditingId(producto.id);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio.toString());
    setCantidad(producto.cantidad.toString());
    setCategoria(producto.categoria);
    setImagen(producto.imagen);
    setIsDestacado(producto.isDestacado);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio || !cantidad) {
      alert("Por favor complete los campos obligatorios (Nombre, Precio, Cantidad).");
      return;
    }

    const productData = {
      nombre,
      descripcion,
      precio: parseFloat(precio) || 0,
      cantidad: parseInt(cantidad) || 0,
      categoria,
      imagen: imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
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
          {CATEGORIES.map((cat) => {
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
                {cat.label.toUpperCase()} ({count})
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
            return (
              <div 
                key={p.id} 
                className="bg-white rounded-[14px] border border-stone-100/60 overflow-hidden card-shadow flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-stone-200"
              >
                {/* Image & Badges */}
                <div className="h-40 bg-stone-100 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={p.imagen} 
                    alt={p.nombre} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 bg-black/70 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                    {CATEGORIES.find(c => c.id === p.categoria)?.label || p.categoria}
                  </span>

                  {/* Featured Badge */}
                  {p.isDestacado && (
                    <span className="absolute top-3 right-3 bg-[#E94E1B] text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                      Destacado
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

      {/* Edit/Create Modal (Slide-over/Dialog) */}
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
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
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

              {/* Imagen */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">URL de Imagen</label>
                <input
                  type="url"
                  value={imagen}
                  onChange={(e) => setImagen(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94E1B]/20 focus:border-[#E94E1B]"
                />
                <p className="text-[10px] text-[#9AA0A6] mt-1">Deja vacío para usar una imagen por defecto.</p>
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
    </div>
  );
}
