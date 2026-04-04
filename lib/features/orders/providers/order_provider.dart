import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../tables/models/mesa_model.dart';

final productProvider = Provider<List<Producto>>((ref) {
  return [
    // --- PARRILLAS ---
    Producto(
      id: 'p1',
      nombre: 'Pollo 1/4 (Pierna)',
      descripcion: 'Con papas fritas y ensalada clásica',
      precio: 24.50,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
      isDestacado: true,
    ),
    Producto(
      id: 'p5',
      nombre: 'Pollo 1/2',
      descripcion: 'Medio Pollo a la brasa con papas y cremas',
      precio: 45.00,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p6',
      nombre: 'Pollo Entero Brider',
      descripcion: 'El sabor clásico del Brasero para compartir',
      precio: 85.00,
      imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
      isDestacado: true,
    ),
    Producto(
      id: 'p2',
      nombre: 'Parrilla Mixta El Brasero',
      descripcion: 'Anticucho, chuleta, pollo y chorizo con papas',
      precio: 68.00,
      imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p3',
      nombre: 'Anticuchos Carretilleros',
      descripcion: '2 palos de corazón de res con rachi y papas',
      precio: 28.50,
      imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),

    // --- PIQUEOS ---
    Producto(
      id: 'p7',
      nombre: 'Tequeños Criollos',
      descripcion: '10 unidades con abundante crema de palta',
      precio: 18.00,
      imagen: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p8',
      nombre: 'Salchipapa Brasera',
      descripcion: 'Frankfurter, papas nativas y huevo frito',
      precio: 22.00,
      imagen: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p9',
      nombre: 'Alitas BBQ (x12)',
      descripcion: 'Jugosas alitas con salsa barbacoa secreta',
      precio: 28.00,
      imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),

    // --- BEBIDAS ---
    Producto(
      id: 'p4',
      nombre: 'Chicha Morada 1L',
      descripcion: 'Maíz morado natural con piña y canela',
      precio: 15.00,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p10',
      nombre: 'Inka Cola 1.5L',
      descripcion: 'Sabor nacional, helada',
      precio: 12.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p13',
      nombre: 'Coca Cola 1.5L',
      descripcion: 'Sabor refrescante',
      precio: 12.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
      categoria: Categoria.bebidas,
    ),

    // --- POSTRES ---
    Producto(
      id: 'p11',
      nombre: 'Picarones Clásicos',
      descripcion: '5 unidades bañadas en miel de chancaca',
      precio: 16.00,
      imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.postres,
    ),
    Producto(
      id: 'p12',
      nombre: 'Tarta de Chocolate',
      descripcion: 'Capa sobre capa de puro chocolate belga',
      precio: 14.50,
      imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.postres,
    ),
  ];
});

class CartItem {
  final Producto producto;
  final int cantidad;

  CartItem({required this.producto, required this.cantidad});
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void add(Producto producto) {
    final index = state.indexWhere((item) => item.producto.id == producto.id);
    if (index != -1) {
      state = [
        for (int i = 0; i < state.length; i++)
          if (i == index)
            CartItem(producto: state[i].producto, cantidad: state[i].cantidad + 1)
          else
            state[i]
      ];
    } else {
      state = [...state, CartItem(producto: producto, cantidad: 1)];
    }
  }

  void remove(String productId) {
    state = state.where((item) => item.producto.id != productId).toList();
  }

  void clear() {
    state = [];
  }

  double get total => state.fold(0, (sum, item) => sum + (item.producto.precio * item.cantidad));
}
