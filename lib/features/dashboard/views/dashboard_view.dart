import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../kitchen/models/order_model.dart';
import '../../tables/providers/table_provider.dart';
import '../../tables/models/mesa_model.dart';
import '../../reports/providers/report_provider.dart';
import '../../../core/services/api_service.dart';

class DashboardView extends ConsumerWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metrics = ref.watch(reportMetricsProvider);
    final tables  = ref.watch(tableProvider);
    final occupied = tables.where((m) => m.status == MesaStatus.ocupada).length;
    final free     = tables.where((m) => m.status == MesaStatus.libre).length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Encabezado ────────────────────────────────────────────────────
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Resumen del día',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.black,
                    ),
                  ),
                  Text(
                    _todayLabel(),
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () => context.go('/mesas'),
                icon: const Icon(Icons.table_restaurant_rounded, size: 16),
                label: const Text('Ver Mesas'),
              ),
              const SizedBox(width: 10),
              OutlinedButton.icon(
                onPressed: () => context.go('/kitchen'),
                icon: const Icon(Icons.restaurant_rounded, size: 16),
                label: const Text('Cocina'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ── Métricas ──────────────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  label: 'Ventas del día',
                  value: metrics.maybeWhen(
                    data: (m) => 'S/ ${m.totalSales.toStringAsFixed(2)}',
                    orElse: () => 'S/ 0.00',
                  ),
                  icon: Icons.payments_rounded,
                  accent: const Color(0xFF1A8952),
                  sub: 'Total facturado hoy',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _MetricCard(
                  label: 'Pedidos hoy',
                  value: metrics.maybeWhen(
                    data: (m) => '${m.totalOrders}',
                    orElse: () => '0',
                  ),
                  icon: Icons.receipt_long_rounded,
                  accent: AppTheme.primaryColor,
                  sub: 'Órdenes registradas',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _MetricCard(
                  label: 'Mesas ocupadas',
                  value: '$occupied / ${tables.length}',
                  icon: Icons.table_restaurant_rounded,
                  accent: const Color(0xFF1A6FBF),
                  sub: '$free mesas disponibles',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _MetricCard(
                  label: 'Ticket promedio',
                  value: metrics.maybeWhen(
                    data: (m) => m.totalOrders > 0
                        ? 'S/ ${(m.totalSales / m.totalOrders).toStringAsFixed(2)}'
                        : 'S/ 0.00',
                    orElse: () => 'S/ 0.00',
                  ),
                  icon: Icons.trending_up_rounded,
                  accent: const Color(0xFF7B4FBF),
                  sub: 'Por orden promedio',
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // ── Cuerpo principal ──────────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pedidos recientes
              Expanded(
                flex: 3,
                child: _SectionCard(
                  title: 'Pedidos Recientes',
                  trailing: TextButton(
                    onPressed: () => context.go('/orders'),
                    child: const Text('Ver todos →'),
                  ),
                  child: _RecentOrdersStream(),
                ),
              ),
              const SizedBox(width: 20),

              // Estado de mesas + accesos rápidos
              Expanded(
                flex: 2,
                child: Column(children: [
                  _SectionCard(
                    title: 'Estado del Salón',
                    child: _TableStatusBars(
                        occupied: occupied,
                        free: free,
                        total: tables.length),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Accesos Rápidos',
                    child: Column(children: [
                      _QuickActionTile(
                        icon: Icons.add_circle_rounded,
                        label: 'Nueva Orden',
                        onTap: () => context.go('/mesas'),
                      ),
                      const SizedBox(height: 8),
                      _QuickActionTile(
                        icon: Icons.kitchen_rounded,
                        label: 'Panel Cocina',
                        onTap: () => context.go('/kitchen'),
                      ),
                      const SizedBox(height: 8),
                      _QuickActionTile(
                        icon: Icons.bar_chart_rounded,
                        label: 'Ver Reportes',
                        onTap: () => context.go('/reports'),
                      ),
                    ]),
                  ),
                ]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _todayLabel() {
    final now = DateTime.now();
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const days = [
      'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
    ];
    return '${days[now.weekday - 1].toUpperCase()}, ${now.day} de ${months[now.month - 1]} de ${now.year}';
  }
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String sub;
  final IconData icon;
  final Color accent;
  const _MetricCard(
      {required this.label,
      required this.value,
      required this.icon,
      required this.accent,
      required this.sub});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderGray),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w500)),
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: accent, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(value,
              style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.black)),
          const SizedBox(height: 4),
          Text(sub,
              style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}

// ─── Section Card ─────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailing;
  const _SectionCard({required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderGray),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.black)),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

// ─── Recent Orders Stream ─────────────────────────────────────────────────────
class _RecentOrdersStream extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return StreamBuilder<List<OrderModel>>(
      stream: Stream.periodic(const Duration(seconds: 3))
          .asyncMap((_) => ref.read(apiServiceProvider).fetchRecentOrders()),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }
        final orders = snapshot.data!;
        if (orders.isEmpty) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: Text('No hay pedidos hoy',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
            ),
          );
        }
        return Column(
          children: orders.map((o) => _OrderRow(order: o)).toList(),
        );
      },
    );
  }
}

class _OrderRow extends StatelessWidget {
  final OrderModel order;
  const _OrderRow({required this.order});

  Color get _statusColor {
    switch (order.status.name) {
      case 'pendiente': return Colors.orange;
      case 'enProceso': return AppTheme.primaryColor;
      case 'listo':     return const Color(0xFF1A8952);
      default:          return AppTheme.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final minutes = DateTime.now().difference(order.createdAt).inMinutes;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.lightGray,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '#${order.mesaNumero}',
                style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryColor),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Mesa ${order.mesaNumero}',
                    style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.black)),
                Text('hace $minutes min',
                    style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 11,
                        color: AppTheme.textMuted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('S/ ${order.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.black)),
              Container(
                margin: const EdgeInsets.only(top: 3),
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  order.status.name.toUpperCase(),
                  style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: _statusColor),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Table Status Bars ────────────────────────────────────────────────────────
class _TableStatusBars extends StatelessWidget {
  final int occupied;
  final int free;
  final int total;
  const _TableStatusBars(
      {required this.occupied, required this.free, required this.total});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _StatusBar(
            label: 'Ocupadas',
            count: occupied,
            total: total,
            color: AppTheme.primaryColor),
        const SizedBox(height: 10),
        _StatusBar(
            label: 'Libres',
            count: free,
            total: total,
            color: const Color(0xFF1A8952)),
        const SizedBox(height: 10),
        _StatusBar(
            label: 'Reservadas',
            count: total - occupied - free,
            total: total,
            color: const Color(0xFF1A6FBF)),
      ],
    );
  }
}

class _StatusBar extends StatelessWidget {
  final String label;
  final int count;
  final int total;
  final Color color;
  const _StatusBar(
      {required this.label,
      required this.count,
      required this.total,
      required this.color});

  @override
  Widget build(BuildContext context) {
    final double ratio = total > 0 ? count / total : 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: AppTheme.textMuted)),
            Text('$count',
                style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.black)),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: ratio,
            backgroundColor: AppTheme.lightGray,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}

// ─── Quick Action Tile ────────────────────────────────────────────────────────
class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickActionTile(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.lightGray,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderGray),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: AppTheme.primaryColor, size: 18),
            ),
            const SizedBox(width: 12),
            Text(label,
                style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.black)),
            const Spacer(),
            const Icon(Icons.arrow_forward_ios_rounded,
                size: 13, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}
