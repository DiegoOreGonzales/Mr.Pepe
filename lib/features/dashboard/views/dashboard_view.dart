import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/theme/app_theme.dart';
import '../../kitchen/models/order_model.dart';
import '../../tables/providers/table_provider.dart';
import '../../tables/models/mesa_model.dart';

class DashboardView extends ConsumerWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Metrics Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildMetricCard('Total ventas', 'S/ 2,450', Icons.monetization_on, Colors.green),
                const SizedBox(width: 24),
                _buildMetricCard('Pedidos hoy', '28', Icons.receipt, Colors.orange),
                const SizedBox(width: 24),
                _buildMetricCard('Mesas ocupadas', '${ref.watch(tableProvider).where((m) => m.status == MesaStatus.ocupada).length}/40', Icons.table_restaurant, Colors.blue),
              ],
            ),
          ),
          const SizedBox(height: 48),
          
          // Main Body
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Recent Orders
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Pedidos Recientes', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),
                    _buildRecentOrdersStream(),
                  ],
                ),
              ),
              const SizedBox(width: 32),
              // Quick Actions
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Acciones Rápidas', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),
                    _buildQuickAction('VER MESAS', Icons.grid_view, AppTheme.emberGradient),
                    const SizedBox(height: 16),
                    _buildQuickAction('MODO COCINA', Icons.restaurant, AppTheme.emberGradient),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 32),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentOrdersStream() {
    return StreamBuilder<List<OrderModel>>(
      stream: FirebaseFirestore.instance
          .collection('orders')
          .orderBy('createdAt', descending: true)
          .limit(5)
          .snapshots()
          .map((s) => s.docs.map((d) => OrderModel.fromFirestore(d)).toList()),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const CircularProgressIndicator();
        final orders = snapshot.data!;
        return Column(
          children: orders.map((o) => _buildOrderTile(o)).toList(),
        );
      },
    );
  }

  Widget _buildOrderTile(OrderModel order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(width: 4, height: 40, color: AppTheme.primaryColor),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Mesa #${order.mesaNumero}', style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('${DateTime.now().difference(order.createdAt).inMinutes} min', style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('S/ ${order.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.primaryColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(order.status.name.toUpperCase(), style: const TextStyle(color: AppTheme.primaryColor, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(String title, IconData icon, Gradient gradient) {
    return Container(
      width: double.infinity,
      height: 80,
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.2), blurRadius: 10)],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
