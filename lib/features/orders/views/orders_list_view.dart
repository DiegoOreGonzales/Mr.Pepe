import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../kitchen/models/order_model.dart';
import '../../../core/services/api_service.dart';

class OrdersListView extends ConsumerWidget {
  const OrdersListView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
            stream: Stream.periodic(const Duration(seconds: 3))
                .asyncMap((_) => ref.read(apiServiceProvider).fetchRecentOrders()),
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
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.receipt_long, color: AppTheme.primaryColor),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Mesa ${order.mesaNumero}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('Total: S/ ${order.total.toStringAsFixed(2)}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getStatusColor(order.status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              order.status.name.toUpperCase(),
                              style: TextStyle(
                                color: _getStatusColor(order.status),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pendiente:
        return Colors.orange;
      case OrderStatus.preparando:
        return Colors.blue;
      case OrderStatus.listo:
        return Colors.green;
      case OrderStatus.entregado:
        return Colors.indigo;
      case OrderStatus.pagado:
        return Colors.grey;
    }
  }
}
