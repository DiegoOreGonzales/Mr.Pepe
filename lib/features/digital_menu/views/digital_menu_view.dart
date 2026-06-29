import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../orders/providers/order_provider.dart';
import '../../tables/models/mesa_model.dart';
import '../../../core/services/api_service.dart';

class DigitalMenuView extends ConsumerWidget {
  final int mesaNumero;
  const DigitalMenuView({super.key, required this.mesaNumero});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productos = ref.watch(productProvider);
    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FF),
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          _buildBanner(),
          _buildProductList(productos, ref),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _callWaiter(context, ref),
        label: const Text('LLAMAR MESERO', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
        icon: const Icon(Icons.notifications_active),
        backgroundColor: AppTheme.primaryColor,
      ),
      bottomNavigationBar: cart.isNotEmpty ? _buildCartFooter(ref) : null,
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      pinned: true,
      expandedHeight: 120,
      backgroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: Text('Mesa $mesaNumero • El Brasero', style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w800, fontSize: 16)),
        centerTitle: true,
      ),
    );
  }

  Widget _buildBanner() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(20),
        height: 160,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: AppTheme.emberGradient,
          boxShadow: [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.3), blurRadius: 20)],
        ),
        padding: const EdgeInsets.all(24),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('OFERTA ESPECIAL', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 12)),
            Text('Pollo a la Brasa + Papas XL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24)),
            Text('¡Solo disponible para hoy!', style: TextStyle(color: Colors.white60, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildProductList(List<Producto> productos, WidgetRef ref) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final p = productos[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(p.imagen, width: 80, height: 80, fit: BoxFit.cover),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.nombre, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text(p.descripcion, style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 2),
                        const SizedBox(height: 8),
                        Text('S/ ${p.precio.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => ref.read(cartProvider.notifier).add(p),
                    icon: const Icon(Icons.add_circle, color: AppTheme.primaryColor, size: 32),
                  ),
                ],
              ),
            );
          },
          childCount: productos.length,
        ),
      ),
    );
  }

  Widget _buildCartFooter(WidgetRef ref) {
    final total = ref.read(cartProvider.notifier).total;
    return Container(
      height: 100,
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('TOTAL ESTIMADO', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
              Text('S/ ${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
            ],
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: const Text('PEDIR AHORA'),
          ),
        ],
      ),
    );
  }

  void _callWaiter(BuildContext context, WidgetRef ref) {
    ref.read(apiServiceProvider).sendAlert(mesaNumero);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Notificación enviada. Un mesero vendrá pronto.')));
  }
}
