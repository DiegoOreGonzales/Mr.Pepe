import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/table_provider.dart';
import 'mesa_card.dart';
import '../../orders/views/toma_pedido_view.dart';
import '../models/mesa_model.dart';
import '../../orders/providers/order_provider.dart';
import '../../kitchen/models/order_model.dart';
import '../../../../core/services/api_service.dart';

final tableFilterProvider = StateProvider<String>((ref) => 'TODAS');

class MesaGridView extends ConsumerWidget {
  const MesaGridView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tables = ref.watch(tableProvider);
    final filter = ref.watch(tableFilterProvider);

    final filteredTables = tables.where((t) {
      if (filter == 'TODAS') return true;
      if (filter == 'LIBRES') return t.status == MesaStatus.libre;
      if (filter == 'OCUPADAS') return t.status == MesaStatus.ocupada;
      if (filter == 'RESERVADAS') return t.status == MesaStatus.reservada;
      return true;
    }).toList();

    final occupied   = tables.where((t) => t.status == MesaStatus.ocupada).length;
    final free       = tables.where((t) => t.status == MesaStatus.libre).length;
    final reserved   = tables.where((t) => t.status == MesaStatus.reservada).length;

    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 750;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Cabecera ───────────────────────────────────────────────────────
        Container(
          color: AppTheme.white,
          padding: EdgeInsets.fromLTRB(isMobile ? 16 : 28, 20, isMobile ? 16 : 28, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isMobile) ...[
                // Layout móvil apilado
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Mapa del Salón',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.black,
                      ),
                    ),
                    Text(
                      '${tables.length} mesas — tiempo real',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          _StatPill(
                              label: 'Libres',
                              count: free,
                              color: const Color(0xFF1A8952)),
                          const SizedBox(width: 8),
                          _StatPill(
                              label: 'Ocupadas',
                              count: occupied,
                              color: AppTheme.primaryColor),
                          const SizedBox(width: 8),
                          _StatPill(
                              label: 'Reservadas',
                              count: reserved,
                              color: const Color(0xFF1A6FBF)),
                          const SizedBox(width: 12),
                          ElevatedButton.icon(
                            onPressed: () => context.push('/print-qr'),
                            icon: const Icon(Icons.qr_code_rounded, size: 14),
                            label: const Text('QR', style: TextStyle(fontSize: 12)),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ] else ...[
                // Layout escritorio original
                Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mapa del Salón',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.black,
                          ),
                        ),
                        Text(
                          '${tables.length} mesas en total — actualización en tiempo real',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    _StatPill(
                        label: 'Libres',
                        count: free,
                        color: const Color(0xFF1A8952)),
                    const SizedBox(width: 8),
                    _StatPill(
                        label: 'Ocupadas',
                        count: occupied,
                        color: AppTheme.primaryColor),
                    const SizedBox(width: 8),
                    _StatPill(
                        label: 'Reservadas',
                        count: reserved,
                        color: const Color(0xFF1A6FBF)),
                    const SizedBox(width: 20),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/print-qr'),
                      icon: const Icon(Icons.qr_code_rounded, size: 16),
                      label: const Text('Imprimir QR'),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),

              // ── Filtros Scrollables ────────────────────────────────────────────
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    _FilterTab(ref: ref, label: 'TODAS', count: tables.length),
                    const SizedBox(width: 6),
                    _FilterTab(ref: ref, label: 'LIBRES', count: free),
                    const SizedBox(width: 6),
                    _FilterTab(ref: ref, label: 'OCUPADAS', count: occupied),
                    const SizedBox(width: 6),
                    _FilterTab(
                        ref: ref, label: 'RESERVADAS', count: reserved),
                  ],
                ),
              ),
              const SizedBox(height: 0),
            ],
          ),
        ),

        Container(height: 1, color: AppTheme.borderGray),

        // ── Grid de Mesas ─────────────────────────────────────────────────
        Expanded(
          child: filteredTables.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.table_restaurant_rounded,
                          size: 48, color: AppTheme.textMuted),
                      SizedBox(height: 12),
                      Text('No hay mesas con este filtro',
                          style: TextStyle(
                              color: AppTheme.textMuted, fontSize: 14)),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(24),
                  gridDelegate:
                      const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 220,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.35,
                  ),
                  itemCount: filteredTables.length,
                  itemBuilder: (context, index) {
                    final mesa = filteredTables[index];
                    return MesaCard(
                      mesa: mesa,
                      onTap: () => _onMesaTap(context, ref, mesa),
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _onMesaTap(BuildContext context, WidgetRef ref, Mesa mesa) {
    if (mesa.status == MesaStatus.ocupada) {
      showDialog(
        context: context,
        builder: (context) => _MesaActionDialog(mesa: mesa, ref: ref),
      );
    } else {
      ref.read(cartProvider.notifier).clear();
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => TomaPedidoView(mesa: mesa)),
      );
    }
  }
}

// ─── Mesa Action Dialog ───────────────────────────────────────────────────────
class _MesaActionDialog extends StatelessWidget {
  final Mesa mesa;
  final WidgetRef ref;
  const _MesaActionDialog({required this.mesa, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: AppTheme.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.table_restaurant_rounded,
                      color: AppTheme.primaryColor, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mesa #${mesa.numero}',
                        style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                            color: AppTheme.black)),
                    const Text('Mesa actualmente ocupada',
                        style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 12,
                            color: AppTheme.textMuted)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Pedidos Activos
            FutureBuilder<List<OrderModel>>(
              future: ref.read(apiServiceProvider).fetchUnpaidOrdersByTable(mesa.numero),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  );
                }
                final orders = snapshot.data ?? [];
                if (orders.isEmpty) {
                  return const SizedBox();
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Pedidos Activos:',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...orders.map((order) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Pedido #${order.id.substring(0, 5)} - S/ ${order.total.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    order.items.map((i) => '${i.cantidad}x ${i.nombre}').join(', '),
                                    style: TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 11,
                                      color: Colors.grey.shade600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            TextButton.icon(
                              onPressed: () {
                                // 1. Limpiar Carrito
                                ref.read(cartProvider.notifier).clear();
                                
                                // 2. Poblar Carrito
                                final List<CartItem> cartItems = [];
                                for (var item in order.items) {
                                  final producto = ref.read(productProvider).firstWhere(
                                    (p) => p.id == item.productId,
                                    orElse: () => Producto(
                                      id: item.productId ?? '',
                                      nombre: item.nombre,
                                      descripcion: '',
                                      precio: item.precio,
                                      imagen: '',
                                      categoria: 'parrillas',
                                    ),
                                  );
                                  cartItems.add(CartItem(producto: producto, cantidad: item.cantidad));
                                }
                                ref.read(cartProvider.notifier).setItems(cartItems);
                                
                                // 3. Establecer orden en edición
                                ref.read(editingOrderProvider.notifier).state = order;
                                
                                // 4. Ir a TomaPedidoView
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => TomaPedidoView(mesa: mesa),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.edit, size: 14),
                              label: const Text('Editar', style: TextStyle(fontSize: 11)),
                              style: TextButton.styleFrom(
                                foregroundColor: AppTheme.primaryColor,
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                  ],
                );
              },
            ),

            const Text('¿Qué deseas hacer?',
                style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: AppTheme.textMuted)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  ref.read(cartProvider.notifier).clear();
                  ref.read(editingOrderProvider.notifier).state = null;
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => TomaPedidoView(mesa: mesa)),
                  );
                },
                icon: const Icon(Icons.add_circle_outlined, size: 18),
                label: const Text('Ver / Agregar Pedido'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/billing', extra: mesa);
                },
                icon: const Icon(Icons.point_of_sale_rounded, size: 18),
                label: const Text('Cobrar Cuenta'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────
class _FilterTab extends StatelessWidget {
  final WidgetRef ref;
  final String label;
  final int count;
  const _FilterTab(
      {required this.ref, required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    final selected = ref.watch(tableFilterProvider);
    final isActive = selected == label;

    return InkWell(
      onTap: () => ref.read(tableFilterProvider.notifier).state = label,
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(8),
        topRight: Radius.circular(8),
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(8),
            topRight: Radius.circular(8),
          ),
          border: Border(
            bottom: BorderSide(
              color: isActive ? AppTheme.primaryColor : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Row(
          children: [
            Text(
              _capitalize(label),
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                fontWeight:
                    isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppTheme.white : AppTheme.textMuted,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isActive
                    ? AppTheme.white.withOpacity(0.25)
                    : AppTheme.lightGray,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: isActive ? AppTheme.white : AppTheme.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0] + s.substring(1).toLowerCase();
  }
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
class _StatPill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _StatPill(
      {required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 6,
              height: 6,
              decoration:
                  BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 5),
          Text('$count $label',
              style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: color)),
        ],
      ),
    );
  }
}
