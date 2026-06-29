enum OrderStatus { pendiente, preparando, listo, entregado, pagado }

class OrderItem {
  final String nombre;
  final int cantidad;
  final double precio;
  final String? productId;
  final String? notas;

  OrderItem({
    required this.nombre,
    required this.cantidad,
    required this.precio,
    this.productId,
    this.notas,
  });

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      nombre: map['nombre'] ?? '',
      cantidad: map['cantidad'] ?? 0,
      precio: (map['precio'] ?? 0.0).toDouble(),
      productId: map['productId'],
      notas: map['notas'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nombre': nombre,
      'cantidad': cantidad,
      'precio': precio,
      'productId': productId,
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

  Map<String, dynamic> toMap() {
    return {
      'mesaNumero': mesaNumero,
      'items': items.map((i) => i.toMap()).toList(),
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'total': total,
    };
  }
}
