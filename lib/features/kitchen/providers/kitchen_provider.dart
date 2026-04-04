import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';

final kitchenProvider = StreamProvider<List<OrderModel>>((ref) {
  final firestore = FirebaseFirestore.instance;
  
  // Escuchar órdenes activas (no entregadas aún)
  return firestore
      .collection('orders')
      .where('status', isNotEqualTo: 'entregado')
      .orderBy('status')
      .orderBy('createdAt')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => OrderModel.fromFirestore(doc)).toList());
});

class KitchenService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    await _firestore.collection('orders').doc(orderId).update({
      'status': newStatus.name,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}

final kitchenServiceProvider = Provider((ref) => KitchenService());
