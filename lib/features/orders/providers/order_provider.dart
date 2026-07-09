import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../tables/models/mesa_model.dart';
import '../../kitchen/models/order_model.dart';

class CategoryNotifier extends StateNotifier<List<CategoryModel>> {
  CategoryNotifier() : super([]) {
    _listenToFirestore();
  }

  void _listenToFirestore() {
    try {
      FirebaseFirestore.instance
          .collection('categories')
          .snapshots()
          .listen((snapshot) async {
        if (snapshot.docs.isEmpty) {
          // Auto-seed default categories if empty
          final defaultCats = [
            {'label': 'Parrillas', 'icon': 'local_fire_department', 'colors': ['#E53935', '#FF7043'], 'emoji': '🔥'},
            {'label': 'Broaster', 'icon': 'lunch_dining', 'colors': ['#F9A825', '#FFCC02'], 'emoji': '🍗'},
            {'label': 'Piqueos', 'icon': 'restaurant', 'colors': ['#E91E63', '#FF6090'], 'emoji': '🍖'},
            {'label': 'Bebidas', 'icon': 'local_cafe', 'colors': ['#1E88E5', '#42A5F5'], 'emoji': '🥤'},
            {'label': 'Extras', 'icon': 'dinner_dining', 'colors': ['#2E7D32', '#66BB6A'], 'emoji': '🍛'},
            {'label': 'Combos', 'icon': 'inventory_2', 'colors': ['#E64A19', '#FF8A65'], 'emoji': '🎁'},
            {'label': 'Postres', 'icon': 'cake', 'colors': ['#8E24AA', '#CE93D8'], 'emoji': '🍰'},
            {'label': 'Ensaladas', 'icon': 'eco', 'colors': ['#43A047', '#A5D6A7'], 'emoji': '🥗'},
          ];

          for (final cat in defaultCats) {
            final id = (cat['label'] as String).toLowerCase();
            await FirebaseFirestore.instance.collection('categories').doc(id).set(cat);
          }
          return;
        }

        final List<CategoryModel> loaded = [];
        for (final doc in snapshot.docs) {
          loaded.add(CategoryModel.fromMap(doc.id, doc.data()));
        }
        // Keep order consistent
        loaded.sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
        state = loaded;
      });
    } catch (e) {
      print('Firestore categories listener error: $e');
    }
  }
}

final categoryProvider = StateNotifierProvider<CategoryNotifier, List<CategoryModel>>((ref) {
  return CategoryNotifier();
});

class ProductNotifier extends StateNotifier<List<Producto>> {
  ProductNotifier(List<Producto> initialProducts) : super(initialProducts) {
    _listenToFirestore();
  }

  void _listenToFirestore() {
    try {
      FirebaseFirestore.instance
          .collection('products')
          .snapshots()
          .listen((snapshot) {
        if (snapshot.docs.isNotEmpty) {
          final List<Producto> updatedProducts = [];
          for (final doc in snapshot.docs) {
            final data = doc.data();
            final categoriaStr = data['categoria'] ?? 'parrillas';

            updatedProducts.add(Producto(
              id: doc.id,
              nombre: data['nombre'] ?? '',
              descripcion: data['descripcion'] ?? '',
              precio: (data['precio'] ?? 0.0).toDouble(),
              imagen: data['imagen'] ?? '',
              categoria: categoriaStr.toString().toLowerCase(),
              isDestacado: data['isDestacado'] ?? false,
            ));
          }
          // Ordenar alfabéticamente
          updatedProducts.sort((a, b) => a.nombre.toLowerCase().compareTo(b.nombre.toLowerCase()));
          state = updatedProducts;
        }
      }, onError: (e) {
        print('Error listening to Firestore products: $e');
      });
    } catch (e) {
      print('Firestore products listener error: $e');
    }
  }
}

final productProvider = StateNotifierProvider<ProductNotifier, List<Producto>>((ref) {
  return ProductNotifier([]);
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

  void setItems(List<CartItem> items) {
    state = items;
  }

  double get total => state.fold(0, (sum, item) => sum + (item.producto.precio * item.cantidad));
}

final editingOrderProvider = StateProvider<OrderModel?>((ref) => null);
