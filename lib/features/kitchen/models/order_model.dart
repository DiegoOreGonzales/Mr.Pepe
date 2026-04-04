import 'package:cloud_firestore/cloud_firestore.dart';
import '../../tables/models/mesa_model.dart';

enum OrderStatus { pendiente, preparando, listo, entregado }

class OrderItem {
  final String productId;
  final String nombre;
  final int cantidad;
  final double precio;
  final String? notas;

  OrderItem({
    required this.productId,
    required this.nombre,
    required this.cantidad,
    required this.precio,
    this.notas,
  });

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      productId: map['productId'] ?? '',
      nombre: map['nombre'] ?? '',
      cantidad: map['cantidad'] ?? 1,
      precio: (map['precio'] ?? 0.0).toDouble(),
      notas: map['notas'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'nombre': nombre,
      'cantidad': cantidad,
      'precio': precio,
      'notas': notas,
    };
  }
}

class OrderModel {
  final String id;
  final int mesaNumero;
  final List<OrderItem> items;
  final OrderStatus status;
  final DateTime createdAt;
  final double total;

  OrderModel({
    required this.id,
    required this.mesaNumero,
    required this.items,
    this.status = OrderStatus.pendiente,
    required this.createdAt,
    required this.total,
  });

  factory OrderModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return OrderModel(
      id: doc.id,
      mesaNumero: data['mesaNumero'] ?? 0,
      items: (data['items'] as List? ?? [])
          .map((item) => OrderItem.fromMap(item))
          .toList(),
      status: _statusFromString(data['status']),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      total: (data['total'] ?? 0.0).toDouble(),
    );
  }

  static OrderStatus _statusFromString(String? status) {
    switch (status) {
      case 'preparando': return OrderStatus.preparando;
      case 'listo': return OrderStatus.listo;
      case 'entregado': return OrderStatus.entregado;
      default: return OrderStatus.pendiente;
    }
  }

  Map<String, dynamic> toMap() {
    return {
      'mesaNumero': mesaNumero,
      'items': items.map((i) => i.toMap()).toList(),
      'status': status.name,
      'createdAt': FieldValue.serverTimestamp(),
      'total': total,
    };
  }
}
