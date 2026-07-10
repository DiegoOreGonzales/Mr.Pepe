import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../models/order_model.dart';
import '../providers/kitchen_provider.dart';

class KitchenView extends ConsumerWidget {
  const KitchenView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(kitchenProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Comandas de Cocina'),
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.onBackgroundColor,
          elevation: 0,
          bottom: TabBar(
            labelColor: AppTheme.primaryColor,
            indicatorColor: AppTheme.primaryColor,
            tabs: [
              _buildTab('PENDIENTES'),
              _buildTab('EN PREPARACIÓN'),
              _buildTab('LISTOS'),
            ],
          ),
        ),
        body: ordersAsync.when(
          data: (orders) => TabBarView(
            children: [
              _buildOrderList(orders.where((o) => o.status == OrderStatus.pendiente).toList(), ref, context),
              _buildOrderList(orders.where((o) => o.status == OrderStatus.preparando).toList(), ref, context),
              _buildOrderList(orders.where((o) => o.status == OrderStatus.listo).toList(), ref, context),
            ],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) {
            if (e.toString().contains('index')) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 64),
                      const SizedBox(height: 16),
                      const Text('Falta un Índice en Firestore', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                      const SizedBox(height: 8),
                      const Text(
                        'Copia el siguiente enlace de tu terminal y ábrelo en el navegador:',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                        child: const Text(
                          'https://console.firebase.google.com/u/0/project/app-polleria-7e98a/firestore/indexes',
                          style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.blue),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => ref.refresh(kitchenProvider),
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                        child: const Text('REINTENTAR DESPUÉS DE CREAR'),
                      ),
                    ],
                  ),
                ),
              );
            }
            return Center(child: Text('Error: $e'));
          },
        ),
      ),
    );
  }

  Widget _buildTab(String label) {
    return Tab(child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)));
  }

  Widget _buildOrderList(List<OrderModel> orders, WidgetRef ref, BuildContext context) {
    if (orders.isEmpty) {
      return const Center(child: Text('Sin comandas en esta sección', style: TextStyle(color: Colors.grey)));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return _buildKitchenCard(order, ref, context);
      },
    );
  }

  Widget _buildKitchenCard(OrderModel order, WidgetRef ref, BuildContext context) {
    final timeElapsed = DateTime.now().difference(order.createdAt).inMinutes;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Mesa #${order.mesaNumero}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: timeElapsed > 15 ? Colors.red.shade50 : Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$timeElapsed min',
                  style: TextStyle(
                    color: timeElapsed > 15 ? Colors.red : Colors.blue,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 30),
          ...order.items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Text('${item.cantidad}x ', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Expanded(child: Text(item.nombre)),
                    if (item.notas != null)
                      Icon(Icons.notes, size: 16, color: Colors.grey.shade400),
                  ],
                ),
              )),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildActionButton(order, ref)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(OrderModel order, WidgetRef ref) {
    switch (order.status) {
      case OrderStatus.pendiente:
        return ElevatedButton(
          onPressed: () => ref
              .read(kitchenServiceProvider)
              .updateOrderStatus(order.id, OrderStatus.preparando),
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
          child: const Text('PREPARAR'),
        );
      case OrderStatus.preparando:
        return ElevatedButton(
          onPressed: () => ref
              .read(kitchenServiceProvider)
              .updateOrderStatus(order.id, OrderStatus.listo),
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successColor),
          child: const Text('LISTO'),
        );
      case OrderStatus.listo:
        return ElevatedButton(
          onPressed: () => ref
              .read(kitchenServiceProvider)
              .updateOrderStatus(order.id, OrderStatus.entregado),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
          child: const Text('ENTREGADO'),
        );
      default:
        return const SizedBox();
    }
  }
}
