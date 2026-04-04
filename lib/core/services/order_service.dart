import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/kitchen/models/order_model.dart';
import '../../features/orders/providers/order_provider.dart';

class OrderService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> submitOrder({
    required int mesaNumero,
    required List<CartItem> items,
    required double total,
  }) async {
    final List<Map<String, dynamic>> itemsMap = items.map((item) => {
      'productId': item.producto.id,
      'nombre': item.producto.nombre,
      'cantidad': item.cantidad,
      'precio': item.producto.precio,
      'notas': null, // Por ahora
    }).toList();

    await _firestore.collection('orders').add({
      'mesaNumero': mesaNumero,
      'items': itemsMap,
      'status': OrderStatus.pendiente.name,
      'createdAt': FieldValue.serverTimestamp(),
      'total': total,
    });
  }
}

final orderServiceProvider = Provider((ref) => OrderService());
