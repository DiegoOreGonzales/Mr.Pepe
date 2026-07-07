import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../tables/models/mesa_model.dart';
import '../../kitchen/models/order_model.dart';

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
            
            Categoria cat = Categoria.parrillas;
            if (categoriaStr == 'piqueos') cat = Categoria.piqueos;
            else if (categoriaStr == 'bebidas') cat = Categoria.bebidas;
            else if (categoriaStr == 'postres') cat = Categoria.postres;
            else if (categoriaStr == 'broaster') cat = Categoria.broaster;
            else if (categoriaStr == 'extras' || categoriaStr == 'guarniciones') cat = Categoria.extras;
            else if (categoriaStr == 'combos') cat = Categoria.combos;

            updatedProducts.add(Producto(
              id: doc.id,
              nombre: data['nombre'] ?? '',
              descripcion: data['descripcion'] ?? '',
              precio: (data['precio'] ?? 0.0).toDouble(),
              imagen: data['imagen'] ?? '',
              categoria: cat,
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
  return ProductNotifier([
    // --- POLLO A LA BRASA ---
    Producto(
      id: 'p1',
      nombre: '1/4 Pollo a la Brasa',
      descripcion: 'Con papas fritas, ensalada clásica y cremas',
      precio: 13.50,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
      isDestacado: true,
    ),
    Producto(
      id: 'p2',
      nombre: '1/4 Pollo a la Brasa + Chaufa',
      descripcion: 'Con papas fritas, ensalada, cremas y chaufa',
      precio: 15.50,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p3',
      nombre: '1/8 Pollo a la Brasa (Solo)',
      descripcion: 'Con papas fritas, ensalada clásica y cremas',
      precio: 9.00,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p4',
      nombre: '1/4 Pollo a la Brasa a lo Pobre',
      descripcion: 'Con papas, ensalada, huevo frito, plátano frito y cremas',
      precio: 22.50,
      imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p5',
      nombre: 'Caja China con Chaufa',
      descripcion: 'Porción de caja china crujiente con chaufa, papas y ensalada',
      precio: 18.50,
      imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p6',
      nombre: 'Caja China 4 Presas',
      descripcion: 'Caja china dorada y crujiente (4 presas) con acompañamiento',
      precio: 15.00,
      imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),
    Producto(
      id: 'p7',
      nombre: 'Caja China 6 Presas',
      descripcion: 'Caja china dorada y crujiente (6 presas) con acompañamiento',
      precio: 20.00,
      imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.parrillas,
    ),

    // --- POLLO BROASTER ---
    Producto(
      id: 'p8',
      nombre: '1/4 Pollo Broaster',
      descripcion: 'Con papas fritas, ensalada clásica y cremas',
      precio: 16.00,
      imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.broaster,
      isDestacado: true,
    ),
    Producto(
      id: 'p9',
      nombre: '1/4 Pollo Broaster + Chaufa',
      descripcion: 'Con papas fritas, ensalada, cremas y chaufa',
      precio: 18.00,
      imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.broaster,
    ),
    Producto(
      id: 'p10',
      nombre: '1 Piernita Broaster',
      descripcion: 'Con papas fritas, ensalada clásica y cremas',
      precio: 11.50,
      imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.broaster,
    ),
    Producto(
      id: 'p11',
      nombre: '1 Piernita/Entrepiernita + Chaufa',
      descripcion: 'Con papas fritas, ensalada, cremas y chaufa',
      precio: 14.50,
      imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.broaster,
    ),

    // --- ALITAS ---
    Producto(
      id: 'p12',
      nombre: 'Alitas Broaster',
      descripcion: 'Porción de alitas crujientes con papas y cremas',
      precio: 15.00,
      imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p13',
      nombre: 'Alitas a la BBQ',
      descripcion: 'Con papas fritas, cremas y salsa dulce barbacoa',
      precio: 16.00,
      imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p14',
      nombre: 'Alitas Acevichadas',
      descripcion: 'Con papas fritas, cremas y salsa acevichada especial',
      precio: 16.00,
      imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p15',
      nombre: 'Chaufa con Alitas Acevichadas',
      descripcion: 'Arroz chaufa con porción de alitas acevichadas',
      precio: 21.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p16',
      nombre: 'Chaufa con Alitas a la BBQ',
      descripcion: 'Arroz chaufa con alitas en salsa BBQ dulce',
      precio: 21.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),
    Producto(
      id: 'p17',
      nombre: 'Chaufa con Alitas',
      descripcion: 'Arroz chaufa clásico con alitas broaster',
      precio: 17.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.piqueos,
    ),

    // --- EXTRAS ---
    Producto(
      id: 'p18',
      nombre: 'Chaufón',
      descripcion: 'Porción familiar generosa de arroz chaufa',
      precio: 12.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.extras,
    ),
    Producto(
      id: 'p19',
      nombre: 'Super Chaufón',
      descripcion: 'Con chorizo, huevo frito y abundante sabor',
      precio: 14.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.extras,
    ),
    Producto(
      id: 'p20',
      nombre: 'Tallarín Saltado',
      descripcion: 'Salteado criollo al wok con carne o pollo',
      precio: 13.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.extras,
    ),
    Producto(
      id: 'p21',
      nombre: 'Lomo Saltado',
      descripcion: 'Jugoso lomo saltado con papas fritas y arroz',
      precio: 13.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.extras,
    ),
    Producto(
      id: 'p22',
      nombre: 'Chaufa con Lomo',
      descripcion: 'Fusión de arroz chaufa y lomo saltado jugoso',
      precio: 17.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.extras,
    ),
    Producto(
      id: 'p23',
      nombre: 'Pollo a la Plancha',
      descripcion: 'Pechuga de pollo a la plancha con papas y ensalada',
      precio: 15.00,
      imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.extras,
    ),

    // --- COMBOS ---
    Producto(
      id: 'p24',
      nombre: 'Combo 1: Pollo Entero Brasa',
      descripcion: '1 pollo entero a la brasa + papas + chaufón + ensalada + gaseosa/chicha 1.5L',
      precio: 67.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p25',
      nombre: 'Combo 2: 4/4 Pollo Broaster',
      descripcion: '4/4 de pollo broaster + papas + chaufón + ensalada + gaseosa/chicha 1.5L',
      precio: 72.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p26',
      nombre: 'Combo 3: 1/4 Broaster + Chaufa',
      descripcion: '1/4 de pollo broaster + chaufita + gaseosa personal',
      precio: 20.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p27',
      nombre: 'Combo 4: 1/4 Brasa + Chaufa',
      descripcion: '1/4 de pollo a la brasa + chaufita + gaseosa personal',
      precio: 18.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p28',
      nombre: 'Combo 5: Piernita Broaster + Chaufa',
      descripcion: '1 piernita broaster + chaufita + gaseosa personal',
      precio: 16.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p29',
      nombre: 'Combo 6: 1/8 Brasa + Chaufa',
      descripcion: '1/8 de pollo a la brasa + chaufita + gaseosa personal',
      precio: 14.50,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p30',
      nombre: 'Combo Pepsi: Pollo Entero + Pepsi 1.5L',
      descripcion: 'Pollo entero a la brasa + papas + ensalada + cremas + Pepsi 1.5L',
      precio: 52.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p31',
      nombre: 'Combo Pepsi: Pollo Entero + Pepsi 1L',
      descripcion: 'Pollo entero a la brasa + papas + ensalada + cremas + Pepsi 1L',
      precio: 46.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p32',
      nombre: 'Combo Pepsi: 1/2 Pollo + Pepsi 1L',
      descripcion: 'Medio pollo a la brasa + papas + ensalada + cremas + Pepsi 1L',
      precio: 30.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p33',
      nombre: 'Combo Pepsi: 1/2 Pollo (Económico)',
      descripcion: 'Medio pollo + papas + ensalada + Pepsi 1L',
      precio: 28.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p34',
      nombre: 'Combo Pepsi: 4/4 Broaster + Chaufa',
      descripcion: '4/4 pollo broaster + papas + chaufa + Pepsi 1.5L',
      precio: 60.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p35',
      nombre: 'Combo Pepsi: 4/4 Broaster + Ensalada',
      descripcion: '4/4 pollo broaster + papas + ensalada + Pepsi 1.5L',
      precio: 56.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p36',
      nombre: 'Combo Pepsi: 2/4 Broaster + Chaufa',
      descripcion: '2/4 pollo broaster + papas + chaufa + Pepsi 1L',
      precio: 31.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),
    Producto(
      id: 'p37',
      nombre: 'Combo Pepsi: 2/4 Broaster + Ensalada',
      descripcion: '2/4 pollo broaster + papas + ensalada + Pepsi 1L',
      precio: 29.00,
      imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.combos,
    ),

    // --- BEBIDAS ---
    Producto(
      id: 'p38',
      nombre: 'Chicha Morada Jarra',
      descripcion: 'Bebida natural de maíz morado, piña y limón',
      precio: 5.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p39',
      nombre: 'Maracuyá Jarra',
      descripcion: 'Refrescante jugo natural de maracuyá',
      precio: 5.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p40',
      nombre: 'Limonada Frozen',
      descripcion: 'Limonada helada estilo frozen batida al instante',
      precio: 9.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p41',
      nombre: 'Limonada Tibia',
      descripcion: 'Limonada tibia ideal para acompañar',
      precio: 6.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p42',
      nombre: 'Jarra de Mate',
      descripcion: 'Mate caliente de hierbas seleccionadas',
      precio: 6.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p43',
      nombre: 'Taza Mate o Café',
      descripcion: 'Una taza de mate o café caliente',
      precio: 2.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p44',
      nombre: 'Gaseosa Personal',
      descripcion: 'Inca Cola / Coca Cola / Pepsi personal',
      precio: 2.50,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p45',
      nombre: 'Gaseosa 600ml',
      descripcion: 'Inca Cola / Coca Cola / Pepsi de 600ml',
      precio: 3.50,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p46',
      nombre: 'Gaseosa 1L',
      descripcion: 'Inca Cola / Coca Cola / Pepsi de 1L',
      precio: 6.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p47',
      nombre: 'Gaseosa 1.5L',
      descripcion: 'Inca Cola / Coca Cola / Pepsi de 1.5L',
      precio: 9.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p48',
      nombre: 'Gaseosa 2.25L',
      descripcion: 'Coca Cola 2.25L helada',
      precio: 12.50,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p49',
      nombre: 'Pepsi 500ml',
      descripcion: 'Pepsi de 500ml helada',
      precio: 2.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p50',
      nombre: 'Pepsi 1L',
      descripcion: 'Pepsi de 1L helada',
      precio: 3.50,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p51',
      nombre: 'Pepsi 1.5L',
      descripcion: 'Pepsi de 1.5L helada',
      precio: 5.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p52',
      nombre: 'Big Cola 500ml',
      descripcion: 'Big Cola personal',
      precio: 2.50,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p53',
      nombre: 'Big Cola 1L',
      descripcion: 'Big Cola de 1L',
      precio: 3.50,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p54',
      nombre: 'Big Cola 1.5L',
      descripcion: 'Big Cola de 1.5L',
      precio: 5.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),
    Producto(
      id: 'p55',
      nombre: 'Big Cola 3L',
      descripcion: 'Big Cola de 3L familiar',
      precio: 9.00,
      imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.bebidas,
    ),

    // --- POSTRES ---
    Producto(
      id: 'p56',
      nombre: 'Gelatina',
      descripcion: 'Delicioso vasito de gelatina de fresa/piña',
      precio: 2.00,
      imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.postres,
    ),
    Producto(
      id: 'p57',
      nombre: 'Flan',
      descripcion: 'Flan casero con caramelo',
      precio: 3.00,
      imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.postres,
    ),
    Producto(
      id: 'p58',
      nombre: 'Marquesa',
      descripcion: 'Postre frío de chocolate y galletas maría',
      precio: 5.00,
      imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
      categoria: Categoria.postres,
    ),
  ]);
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
