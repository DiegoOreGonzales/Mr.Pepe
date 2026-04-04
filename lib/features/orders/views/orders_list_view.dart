import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/theme/app_theme.dart';
import '../../kitchen/models/order_model.dart';

class OrdersListView extends StatelessWidget {
  const OrdersListView({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Gestión de Pedidos', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppTheme.primaryColor)),
              const Text('Historial y seguimiento en tiempo real', style: TextStyle(color: Colors.grey, fontSize: 13)),
            ],
          ),
        ),
        
        Expanded(
          child: StreamBuilder<List<OrderModel>>(
            stream: FirebaseFirestore.instance
                .collection('orders')
                .orderBy('createdAt', descending: true)
                .snapshots()
                .map((snapshot) => snapshot.docs.map((doc) => OrderModel.fromFirestore(doc)).toList()),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return Center(child: Text('Error: ${snapshot.error}'));
              }
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }
              
              final orders = snapshot.data!;
              
              if (orders.isEmpty) {
                return const Center(child: Text('No hay pedidos realizados aún.'));
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                itemCount: orders.length,
                itemBuilder: (context, index) {
                  final order = orders[index];
                  return _buildOrderCard(order);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    Color statusColor;
    switch (order.status) {
      case OrderStatus.pendiente: statusColor = Colors.orange; break;
      case OrderStatus.preparando: statusColor = Colors.blue; break;
      case OrderStatus.entregado: statusColor = Colors.green; break;
      default: statusColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
        border: Border(left: BorderSide(color: statusColor, width: 4)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Mesa ${order.mesaNumero}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Text(
                        order.status.name.toUpperCase(),
                        style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${order.items.length} productos • S/ ${order.total.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${order.createdAt.hour}:${order.createdAt.minute.toString().padLeft(2, '0')}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ],
      ),
    );
  }
}
