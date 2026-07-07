import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/order_provider.dart';
import '../../tables/models/mesa_model.dart';
import '../../../../core/services/order_service.dart';
import '../../tables/providers/table_provider.dart';
import '../../kitchen/models/order_model.dart';
import '../../../../core/services/api_service.dart';

final categoryFilterProvider = StateProvider<Categoria>((ref) => Categoria.parrillas);

class TomaPedidoView extends ConsumerWidget {
  final Mesa mesa;

  const TomaPedidoView({super.key, required this.mesa});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedCategory = ref.watch(categoryFilterProvider);
    final productos = ref.watch(productProvider).where((p) => p.categoria == selectedCategory).toList();
    final cart = ref.watch(cartProvider);
    final total = ref.read(cartProvider.notifier).total;

    final editingOrder = ref.watch(editingOrderProvider);

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          ref.read(editingOrderProvider.notifier).state = null;
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(editingOrder != null 
              ? 'Editar Pedido - Mesa #${mesa.numero}' 
              : 'Mesa #${mesa.numero} - Toma de Pedido'),
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.onBackgroundColor,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              ref.read(editingOrderProvider.notifier).state = null;
              Navigator.pop(context);
            },
          ),
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
                _buildCategoryToken(ref, 'Parrillas', Categoria.parrillas),
                _buildCategoryToken(ref, 'Broaster', Categoria.broaster),
                _buildCategoryToken(ref, 'Alitas / Piqueos', Categoria.piqueos),
                _buildCategoryToken(ref, 'Combos', Categoria.combos),
                _buildCategoryToken(ref, 'Extras', Categoria.extras),
                _buildCategoryToken(ref, 'Bebidas', Categoria.bebidas),
                _buildCategoryToken(ref, 'Postres', Categoria.postres),
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
            stream: Stream.periodic(const Duration(seconds: 3))
                .asyncMap((_) => ref.read(apiServiceProvider).fetchActiveOrders())
                .map((orders) => orders.where((o) => o.mesaNumero == mesa.numero).toList()),
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
      // Floating Cart with Summary
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: cart.isEmpty
          ? null
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Mini Resumen de Borrador (Lo que se va a enviar)
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [BoxShadow(blurRadius: 10, color: Colors.black12)],
                    border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('POR ENVIAR A COCINA (REVISA):',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                      const SizedBox(height: 8),
                      ...cart.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              children: [
                                Text('${item.cantidad}x ', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                Expanded(child: Text(item.producto.nombre, style: const TextStyle(fontSize: 12))),
                                IconButton(
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  onPressed: () => ref.read(cartProvider.notifier).remove(item.producto.id),
                                  icon: const Icon(Icons.close, size: 14, color: Colors.red),
                                ),
                              ],
                            ),
                          )),
                    ],
                  ),
                ),
                Container(
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
                            'S/ ${total.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                          const Text(
                            'TOTAL NUEVO',
                            style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: () async {
                          if (cart.isEmpty) return;
                          
                          final editingOrder = ref.read(editingOrderProvider);
                          if (editingOrder != null) {
                            // 1. Actualizar la orden existente
                            await ref.read(orderServiceProvider).updateOrder(
                              orderId: editingOrder.id,
                              items: cart,
                              total: total,
                            );
                            
                            // 2. Limpiar estado de edición
                            ref.read(editingOrderProvider.notifier).state = null;
                          } else {
                            // 1. Enviar una nueva orden
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
                          }

                          // Limpiar Carrito
                          ref.read(cartProvider.notifier).clear();

                          // Volver y mostrar mensaje
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(editingOrder != null 
                                  ? '¡Pedido actualizado con éxito!' 
                                  : '¡Pedido enviado a cocina!')
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        child: Text(editingOrder != null ? 'ACTUALIZAR PEDIDO' : 'CONFIRMAR PEDIDO'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
      ),
    );
  }

  Widget _buildCategoryToken(WidgetRef ref, String label, Categoria category) {
    final selectedCategory = ref.watch(categoryFilterProvider);
    final bool isSelected = selectedCategory == category;
    
    return InkWell(
      onTap: () => ref.read(categoryFilterProvider.notifier).state = category,
      borderRadius: BorderRadius.circular(30),
      child: Container(
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
      ),
    );
  }

  Widget _buildProductCard(Producto producto, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final cartItem = cart.where((item) => item.producto.id == producto.id).firstOrNull;
    final int quantity = cartItem?.cantidad ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: quantity > 0 ? AppTheme.primaryColor : Colors.grey.shade300, width: 4)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  producto.imagen,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                ),
              ),
              if (quantity > 0)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: AppTheme.primaryColor, shape: BoxShape.circle),
                    child: Text('$quantity', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
            ],
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
          Column(
            children: [
              IconButton(
                onPressed: () => ref.read(cartProvider.notifier).add(producto),
                icon: const Icon(Icons.add_circle, color: AppTheme.primaryColor, size: 32),
              ),
              if (quantity > 0)
                IconButton(
                  onPressed: () => ref.read(cartProvider.notifier).remove(producto.id),
                  icon: const Icon(Icons.remove_circle_outline, color: Colors.grey, size: 24),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
