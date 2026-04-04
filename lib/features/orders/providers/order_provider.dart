import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../tables/models/mesa_model.dart';

final productProvider = Provider<List<Producto>>((ref) {
  return [
    Producto(
      id: 'p1',
      nombre: 'Pollo a la Brasa 1/4',
      descripcion: 'Con papas fritas y ensalada clásica',
      precio: 24.50,
      imagen: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
      isDestacado: true,
    ),
    Producto(
      id: 'p2',
      nombre: 'Parrilla Mixta Personal',
      descripcion: 'Anticucho, chuleta y pollo a la parrilla',
      precio: 48.00,
      imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p3',
      nombre: 'Anticuchos (2 palos)',
      descripcion: 'Corazón de res con papas doradas',
      precio: 22.50,
      imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p4',
      nombre: 'Chicha Morada 1L',
      descripcion: 'Maíz morado natural con piña y canela',
      precio: 12.00,
      imagen: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
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
    state = [...state, CartItem(producto: producto, cantidad: 1)];
  }

  double get total => state.fold(0, (sum, item) => sum + (item.producto.precio * item.cantidad));
}
