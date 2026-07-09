"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  imagen?: string;
}

interface CartItem {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface TableOrderModalProps {
  mesaNumero: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CategoriaDoc {
  id: string;
  label: string;
  emoji: string;
}

// Smart Product Category Matcher based on name and fallback to Firestore category
function getEffectiveCategory(nombre: string, categoriaOriginal: string): string {
  const nameLower = nombre.toLowerCase();
  
  if (nameLower.includes("brasa") || nameLower.includes("pollo a la brasa")) return "parrillas";
  if (nameLower.includes("broaster")) return "broaster";
  if (nameLower.includes("alitas") || nameLower.includes("piqueo") || nameLower.includes("tequeño")) return "piqueos";
  if (
    nameLower.includes("pepsi") || nameLower.includes("cola") || nameLower.includes("chicha") || 
    nameLower.includes("maracuya") || nameLower.includes("limonada") || nameLower.includes("agua") || 
    nameLower.includes("mate") || nameLower.includes("jugo") || nameLower.includes("bebida")
  ) {
    return "bebidas";
  }
  if (nameLower.includes("flan") || nameLower.includes("marquesa") || nameLower.includes("gelatina") || nameLower.includes("postre")) return "postres";
  if (nameLower.includes("ensalada")) return "ensaladas";
  if (nameLower.includes("combo")) return "combos";
  if (
    nameLower.includes("guarnicion") || nameLower.includes("porcion") || nameLower.includes("papas") || 
    nameLower.includes("arroz") || nameLower.includes("chaufa") || nameLower.includes("lomo") || 
    nameLower.includes("tallarin")
  ) {
    return "extras";
  }
  
  return categoriaOriginal.toLowerCase();
}

export default function TableOrderModal({ mesaNumero, onClose, onSuccess }: TableOrderModalProps) {
  // Current active order state (if occupied)
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [activeOrderLoading, setActiveOrderLoading] = useState(true);

  // Cart / Menu State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoriaDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("parrillas");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddingItems, setIsAddingItems] = useState(false);

  // Billing / Checkout State
  const [isBilling, setIsBilling] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<"boleta" | "factura">("boleta");
  const [documento, setDocumento] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [voucherNumber, setVoucherNumber] = useState("");

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch products from Firestore
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(prods);
    });
    return unsubscribe;
  }, []);

  // 1b. Fetch categories from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const loaded: CategoriaDoc[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          label: data.label || "",
          emoji: data.emoji || "🍔"
        });
      });
      loaded.sort((a, b) => a.label.localeCompare(b.label));
      setCategories(loaded);
      
      // Auto select first category
      if (loaded.length > 0) {
        setSelectedCategory(loaded[0].id);
      }
    });
    return unsubscribe;
  }, []);
  // 2. Fetch active order for this table from database
  const fetchActiveOrder = async () => {
    setActiveOrderLoading(true);
    try {
      const res = await fetch(`/api/orders?mesa=${mesaNumero}&unpaid=true`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setActiveOrder(json.data[0]); // Get current active unpaid order
      } else {
        setActiveOrder(null);
      }
    } catch (e) {
      console.error("Error fetching active order:", e);
    } finally {
      setActiveOrderLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrder();
  }, [mesaNumero]);

  // Document Auto-fill via DNI/RUC API
  const handleDocumentoChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setDocumento(cleaned);

    if (tipoDocumento === "boleta" && cleaned.length === 8) {
      setLoadingDoc(true);
      setClienteNombre("Buscando en RENIEC...");
      try {
        const res = await fetch(`/api/reniec?dni=${cleaned}`);
        const data = await res.json();
        if (data.success) {
          setClienteNombre(data.data.nombreCompleto);
          showToast("success", "Identidad verificada con RENIEC");
        } else {
          setClienteNombre("");
          showToast("error", "DNI no encontrado");
        }
      } catch {
        setClienteNombre("");
      } finally {
        setLoadingDoc(false);
      }
    } else if (tipoDocumento === "factura" && cleaned.length === 11) {
      setLoadingDoc(true);
      setClienteNombre("Buscando en SUNAT...");
      try {
        const res = await fetch(`/api/reniec?ruc=${cleaned}`);
        const data = await res.json();
        if (data.success) {
          setClienteNombre(data.data.razonSocial);
          showToast("success", "RUC verificado con SUNAT");
        } else {
          setClienteNombre("");
          showToast("error", "RUC no encontrado");
        }
      } catch {
        setClienteNombre("");
      } finally {
        setLoadingDoc(false);
      }
    }
  };

  // Add/Remove Cart Helpers
  const addToCart = (prod: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.nombre === prod.nombre);
      if (existing) {
        return prev.map((item) =>
          item.nombre === prod.nombre ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { nombre: prod.nombre, cantidad: 1, precio: prod.precio }];
    });
  };

  const removeFromCart = (nombre: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.nombre === nombre ? { ...item, cantidad: item.cantidad - 1 } : item))
        .filter((item) => item.cantidad > 0)
    );
  };

  const totalCart = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  // Submit Order (New or Add to existing)
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    try {
      if (activeOrder && isAddingItems) {
        // Adding products to existing active order
        const mergedItems = [...activeOrder.items];
        cart.forEach((cItem) => {
          const existing = mergedItems.find((item: any) => item.nombre === cItem.nombre);
          if (existing) {
            existing.cantidad += cItem.cantidad;
          } else {
            mergedItems.push(cItem);
          }
        });

        const newTotal = mergedItems.reduce((sum: number, item: any) => sum + item.precio * item.cantidad, 0);

        const res = await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeOrder.id,
            items: mergedItems,
            total: newTotal,
          }),
        });

        const json = await res.json();
        if (json.success) {
          showToast("success", "Productos añadidos al pedido de la mesa");
          setCart([]);
          setIsAddingItems(false);
          fetchActiveOrder();
          if (onSuccess) onSuccess();
        } else {
          showToast("error", json.error || "Error al actualizar pedido");
        }
      } else {
        // Create new order
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mesaNumero,
            items: cart,
            total: totalCart,
          }),
        });

        const json = await res.json();
        if (json.success) {
          showToast("success", "Pedido enviado a cocina correctamente");
          setCart([]);
          fetchActiveOrder();
          if (onSuccess) onSuccess();
        } else {
          showToast("error", json.error || "Error al crear pedido");
        }
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error de conexión");
    }
  };

  // Process checkout / pre-billing
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (!documento || !clienteNombre) {
      alert("Por favor complete los datos del cliente");
      return;
    }

    const generatedVoucher = voucherNumber || `${tipoDocumento === "factura" ? "F" : "B"}${String(mesaNumero).padStart(2, "0")}-${Date.now().toString().slice(-6)}`;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeOrder.id,
          status: "pagado",
          clienteNombre,
          clienteDocumento: documento,
          tipoDocumento,
          voucherNumber: generatedVoucher,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", "¡Pago procesado y mesa liberada con éxito!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        showToast("error", json.error || "Error al procesar pago");
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error al conectar con el servidor");
    }
  };

  // Release table manually without payment (Reset status)
  const handleFreeTableManually = async () => {
    if (!confirm("¿Está seguro de que desea liberar esta mesa? El pedido activo será cancelado/eliminado.")) return;

    try {
      if (activeOrder) {
        await fetch(`/api/orders?id=${activeOrder.id}`, { method: "DELETE" });
      }
      
      // Update table directly to free
      const tableId = `mesa_${mesaNumero}`;
      const res = await fetch("/api/tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tableId,
          status: "libre",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", "Mesa liberada correctamente");
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error al liberar mesa");
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const effectiveCategory = getEffectiveCategory(p.nombre, p.categoria);
    const matchesCategory = effectiveCategory === selectedCategory;
    const matchesSearch = searchQuery === "" || p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (searchQuery !== "" || matchesCategory);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/55 backdrop-blur-sm">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold animate-fade-in ${
            toast.type === "success" ? "bg-[#1A8952] text-white" : "bg-[#BF391B] text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "verified" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      <div className="bg-white w-full max-w-4xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#BF391B] text-white text-xs font-black flex items-center justify-center">
              M{mesaNumero}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#0D0D0D]">Atención de Mesa {mesaNumero}</h2>
              <p className="text-[11px] text-[#9AA0A6] font-semibold uppercase">
                {activeOrder ? `Pedido activo: S/ ${activeOrder.total.toFixed(2)}` : "Mesa Libre / Sin Pedido"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 material-symbols-outlined">
            close
          </button>
        </div>

        {/* Content Body */}
        {activeOrderLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-2">
            <div className="w-8 h-8 border-4 border-[#BF391B]/20 border-t-[#BF391B] rounded-full animate-spin" />
            <span className="text-xs font-bold">Cargando estado de mesa...</span>
          </div>
        ) : isBilling ? (
          /* BILLING/CHECKOUT VIEW */
          <form onSubmit={handleCheckout} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0D0D0D] uppercase tracking-wide">Procesar Comprobante de Pago</h3>
              <button
                type="button"
                onClick={() => setIsBilling(false)}
                className="text-xs font-bold text-[#BF391B] hover:underline"
              >
                ← Volver al pedido
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resumen del Pedido */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-4">
                <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest">Resumen de Cuenta</h4>
                <div className="divide-y divide-stone-200/60 max-h-60 overflow-y-auto pr-1">
                  {activeOrder?.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex justify-between text-xs">
                      <span>
                        <strong className="text-stone-700">{item.cantidad}x</strong> {item.nombre}
                      </span>
                      <span className="font-bold text-[#0D0D0D]">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-stone-700">Total a Cobrar:</span>
                  <span className="text-2xl font-black text-[#BF391B]">S/ {activeOrder?.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Formulario Cliente */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest">Datos de Facturación</h4>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoDocumento("boleta");
                      setDocumento("");
                      setClienteNombre("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      tipoDocumento === "boleta"
                        ? "bg-black text-white border-black"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Boleta (DNI)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoDocumento("factura");
                      setDocumento("");
                      setClienteNombre("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      tipoDocumento === "factura"
                        ? "bg-black text-white border-black"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Factura (RUC)
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                      Número {tipoDocumento === "factura" ? "RUC" : "DNI"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={documento}
                        onChange={(e) => handleDocumentoChange(e.target.value)}
                        placeholder={tipoDocumento === "factura" ? "Ej: 10418236103" : "Ej: 70123456"}
                        maxLength={tipoDocumento === "factura" ? 11 : 8}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-[#0D0D0D] placeholder:text-stone-300 focus:outline-none focus:border-[#BF391B] focus:ring-2 focus:ring-[#BF391B]/10 pr-10"
                      />
                      {loadingDoc && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#BF391B]/20 border-t-[#BF391B] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                      Nombre / Razón Social
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Nombre del cliente o empresa"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-[#0D0D0D] focus:outline-none focus:border-[#BF391B] focus:ring-2 focus:ring-[#BF391B]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                      Número de Comprobante (Opcional - Autogenerado)
                    </label>
                    <input
                      type="text"
                      value={voucherNumber}
                      onChange={(e) => setVoucherNumber(e.target.value)}
                      placeholder="Ej: B001-000412"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm font-mono focus:outline-none focus:border-[#BF391B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex gap-4">
              <button
                type="button"
                onClick={() => setIsBilling(false)}
                className="flex-1 py-3 border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all text-sm"
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1A8952] hover:bg-[#156E41] text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 shadow-md shadow-green-100"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Confirmar y Cobrar Cuenta
              </button>
            </div>
          </form>
        ) : (
          /* DEFAULT MENU / ORDER DETAILS VIEW */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Menu Selector (if Free or Adding) */}
            {(!activeOrder || isAddingItems) ? (
              <div className="flex-1 flex flex-col p-5 border-r border-stone-100 overflow-hidden">
                {/* Search products */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto en la carta..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 outline-none focus:border-[#BF391B] transition-all bg-white"
                  />
                </div>

                {/* Categories Bar */}
                {searchQuery === "" && (
                  <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-stone-50 scrollbar-thin">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1 ${
                          selectedCategory === cat.id
                            ? "bg-black text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className="p-3 bg-stone-50 hover:bg-[#BF391B]/5 border border-stone-100 hover:border-[#BF391B]/20 rounded-xl transition-all duration-200 flex flex-col text-left group relative"
                    >
                      <span className="text-xs font-bold text-[#0D0D0D] group-hover:text-[#BF391B] line-clamp-1">
                        {prod.nombre}
                      </span>
                      <span className="text-xs font-black text-[#BF391B] mt-1">S/ {prod.precio.toFixed(2)}</span>
                      <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white border border-stone-200 text-stone-500 flex items-center justify-center group-hover:bg-[#BF391B] group-hover:text-white group-hover:border-[#BF391B] transition-all">
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-stone-400 text-xs">
                      No se encontraron productos.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Occupied table details column */
              <div className="flex-1 p-6 flex flex-col justify-between bg-stone-50 border-r border-stone-100 overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-[#BF391B]/5 border border-[#BF391B]/15 rounded-2xl">
                    <span className="material-symbols-outlined text-[#BF391B] text-[22px]">restaurant</span>
                    <div>
                      <h4 className="text-xs font-black text-[#BF391B] uppercase tracking-wider">Mesa Ocupada</h4>
                      <p className="text-[11px] text-[#8C2510] font-medium mt-0.5">
                        Registrado hace {Math.max(0, Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000))} minutos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Pedido en Preparación</h5>
                    <div className="bg-white rounded-xl border border-stone-200/70 divide-y divide-stone-100 overflow-hidden">
                      {activeOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 flex justify-between items-center text-xs">
                          <span className="font-semibold text-stone-800">
                            <strong className="text-stone-500 mr-1.5">{item.cantidad}x</strong> {item.nombre}
                          </span>
                          <span className="font-bold text-stone-800">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsAddingItems(true)}
                      className="flex-1 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                      Agregar Productos
                    </button>
                    <button
                      onClick={handleFreeTableManually}
                      className="py-2.5 px-3 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-xs transition-all flex items-center justify-center"
                      title="Liberar Mesa"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsBilling(true)}
                    className="w-full py-3 bg-[#BF391B] hover:bg-[#8C2510] text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    Pre-facturar / Cobrar Cuenta
                  </button>
                </div>
              </div>
            )}

            {/* Right Column: Cart summary */}
            {(!activeOrder || isAddingItems) && (
              <div className="w-80 p-5 flex flex-col justify-between bg-stone-50/50">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">
                      {isAddingItems ? "Añadir al Pedido" : "Nueva Orden"}
                    </h3>
                    {isAddingItems && (
                      <button
                        onClick={() => {
                          setCart([]);
                          setIsAddingItems(false);
                        }}
                        className="text-[10px] font-bold text-stone-400 hover:text-stone-600"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {/* Cart items */}
                  <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1">
                    {cart.map((item) => (
                      <div key={item.nombre} className="py-2.5 flex justify-between items-center text-xs">
                        <div className="max-w-[150px]">
                          <p className="font-semibold text-stone-800 line-clamp-1">{item.nombre}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">S/ {item.precio.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.nombre)}
                            className="w-5 h-5 rounded bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-800 w-4 text-center">{item.cantidad}</span>
                          <button
                            onClick={() =>
                              setCart((prev) =>
                                prev.map((i) =>
                                  i.nombre === item.nombre ? { ...i, cantidad: i.cantidad + 1 } : i
                                )
                              )
                            }
                            className="w-5 h-5 rounded bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-[11px] gap-1.5">
                        <span className="material-symbols-outlined text-3xl text-stone-200">shopping_basket</span>
                        <span>Seleccione productos de la carta</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-stone-500">Monto Total:</span>
                    <span className="text-xl font-black text-[#BF391B]">S/ {totalCart.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleSubmitOrder}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-[#BF391B] hover:bg-[#8C2510] disabled:bg-stone-200 disabled:text-stone-400 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    {isAddingItems ? "Confirmar Adición" : "Enviar Pedido a Cocina"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
