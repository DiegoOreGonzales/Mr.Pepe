import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/order_provider.dart';
import '../../tables/models/mesa_model.dart';
import '../../../../core/services/order_service.dart';
import '../../tables/providers/table_provider.dart';
import '../../kitchen/models/order_model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class TomaPedidoView extends ConsumerWidget {
  final Mesa mesa;

  const TomaPedidoView({super.key, required this.mesa});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productos = ref.watch(productProvider);
    final cart = ref.watch(cartProvider);
    final total = ref.read(cartProvider.notifier).total;

    return Scaffold(
      appBar: AppBar(
        title: Text('Mesa #${mesa.numero} - Toma de Pedido'),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.onBackgroundColor,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Categorías
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: [
                _buildCategoryToken('Parrillas', isSelected: true),
                _buildCategoryToken('Piqueos'),
                _buildCategoryToken('Bebidas'),
                _buildCategoryToken('Postres'),
              ],
            ),
          ),
          // Lista de Productos
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: productos.length,
              itemBuilder: (context, index) {
                final producto = productos[index];
                return _buildProductCard(producto, ref);
              },
            ),
          ),
          
          // --- NUEVA SECCIÓN: VER PEDIDOS ACTUALES ---
          StreamBuilder<List<OrderModel>>(
            stream: FirebaseFirestore.instance
                .collection('orders')
                .where('mesaNumero', isEqualTo: mesa.numero)
                .where('status', isNotEqualTo: 'entregado')
                .snapshots()
                .map((snapshot) => snapshot.docs.map((doc) => OrderModel.fromFirestore(doc)).toList()),
            builder: (context, snapshot) {
              if (!snapshot.hasData || snapshot.data!.isEmpty) return const SizedBox();
              
              final allItems = snapshot.data!.expand((o) => o.items).toList();
              
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.receipt_long, size: 16, color: AppTheme.primaryColor),
                        const SizedBox(width: 8),
                        Text(
                          'PEDIDOS YA ENVIADOS (${allItems.length})',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primaryColor),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: allItems.map((item) => Chip(
                        label: Text('${item.cantidad}x ${item.nombre}', style: const TextStyle(fontSize: 10)),
                        backgroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                      )).toList(),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 100), // Espacio para el carrito flotante
        ],
      ),
      // Floating Cart
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: cart.isEmpty
          ? null
          : Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.onBackgroundColor.withOpacity(0.95),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(blurRadius: 10, color: Colors.black26)],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${cart.length} items · S/ ${total.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      const Text(
                        'RESUMEN PARCIAL',
                        style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      if (cart.isEmpty) return;
                      
                      // 1. Enviar la orden a Firestore
                      await ref.read(orderServiceProvider).submitOrder(
                        mesaNumero: mesa.numero,
                        items: cart,
                        total: total,
                      );

                      // 2. Marcar la mesa como ocupada
                      await ref.read(tableProvider.notifier).updateTableStatus(
                        mesa.id, 
                        MesaStatus.ocupada,
                        encargado: 'Mesero Admin',
                      );

                      // 3. Volver y mostrar mensaje
                      if (context.mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('¡Pedido enviado a cocina!')),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    child: const Text('CONFIRMAR PEDIDO'),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildCategoryToken(String label, {bool isSelected = false}) {
    return Container(
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.primaryColor : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade200),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey.shade600,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildProductCard(Producto producto, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: const Border(left: BorderSide(color: AppTheme.primaryColor, width: 4)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              producto.imagen,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                width: 80,
                height: 80,
                color: Colors.grey.shade100,
                child: const Icon(Icons.fastfood, color: AppTheme.primaryColor),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(producto.nombre, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(producto.descripcion, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                const SizedBox(height: 8),
                Text('S/ ${producto.precio.toStringAsFixed(2)}',
                    style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => ref.read(cartProvider.notifier).add(producto),
            icon: const Icon(Icons.add_circle, color: AppTheme.primaryContainer, size: 32),
          ),
        ],
      ),
    );
  }
}
