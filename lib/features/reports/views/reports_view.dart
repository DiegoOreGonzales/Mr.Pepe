import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/report_provider.dart';

class ReportsView extends ConsumerWidget {
  const ReportsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metricsAsync = ref.watch(reportMetricsProvider);
    final period = ref.watch(reportPeriodProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FF),
      body: metricsAsync.when(
        data: (metrics) => SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with Filters
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Reportes', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppTheme.primaryColor)),
                      Text('Rendimiento real del restaurante', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  Row(
                    children: [
                      _buildFilterButton(ref, 'HOY', ReportPeriod.hoy, period == ReportPeriod.hoy),
                      _buildFilterButton(ref, 'ESTA SEMANA', ReportPeriod.semana, period == ReportPeriod.semana),
                      _buildFilterButton(ref, 'ESTE MES', ReportPeriod.mes, period == ReportPeriod.mes),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Top Metric Cards (Responsivo)
              LayoutBuilder(
                builder: (context, constraints) {
                  final bool useWrap = constraints.maxWidth < 800;
                  if (useWrap) {
                    return Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: [
                        _buildMetricMiniCard('Ventas', 'S/ ${metrics.totalSales.toStringAsFixed(2)}', period.name, Icons.payments, Colors.orange, width: (constraints.maxWidth - 16) / 2),
                        _buildMetricMiniCard('Tickets', 'S/ ${metrics.averageTicket.toStringAsFixed(2)}', 'AVG', Icons.confirmation_number, Colors.blue, width: (constraints.maxWidth - 16) / 2),
                        _buildMetricMiniCard('Pedidos', '${metrics.totalOrders}', 'NUM', Icons.shopping_bag, Colors.purple, width: (constraints.maxWidth - 16) / 2),
                        _buildMetricMiniCard('Tablas', '${metrics.tableUsage.length}', 'USO', Icons.table_restaurant, Colors.green, width: (constraints.maxWidth - 16) / 2),
                      ],
                    );
                  }
                  return Row(
                    children: [
                      Expanded(child: _buildMetricMiniCard('Total ventas', 'S/ ${metrics.totalSales.toStringAsFixed(2)}', period.name.toUpperCase(), Icons.payments, Colors.orange)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildMetricMiniCard('Ticket promedio', 'S/ ${metrics.averageTicket.toStringAsFixed(2)}', 'PROMEDIO', Icons.confirmation_number, Colors.blue)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildMetricMiniCard('Pedidos', '${metrics.totalOrders}', 'ENTREGADOS', Icons.shopping_bag, Colors.purple)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildMetricMiniCard('Mesas activas', '${metrics.tableUsage.length}', 'USO REAL', Icons.table_restaurant, Colors.green)),
                    ],
                  );
                },
              ),
              const SizedBox(height: 32),

              // Charts Row
              Wrap(
                spacing: 24,
                runSpacing: 24,
                children: [
                  // Sales Flow Chart
                  SizedBox(
                    width: MediaQuery.of(context).size.width > 900 ? (MediaQuery.of(context).size.width - 450) * 0.6 : double.infinity,
                    child: _buildCard(
                      title: 'Flujo de Ventas (S/)',
                      subtitle: 'Distribución por hora del día',
                      child: SizedBox(
                        height: 300,
                        child: _buildLineChart(metrics.hourlySales),
                      ),
                    ),
                  ),
                  // Table Usage Chart
                  SizedBox(
                    width: MediaQuery.of(context).size.width > 900 ? 300 : double.infinity,
                    child: _buildCard(
                      title: 'Mesas más usadas',
                      subtitle: 'Frecuencia por mesa',
                      child: SizedBox(
                        height: 300,
                        child: _buildTableBarChart(metrics.tableUsage),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error al cargar reportes: $e')),
      ),
    );
  }

  Widget _buildFilterButton(WidgetRef ref, String label, ReportPeriod value, bool isActive) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      child: InkWell(
        onTap: () => ref.read(reportPeriodProvider.notifier).state = value,
        borderRadius: BorderRadius.circular(30),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? AppTheme.primaryColor : Colors.white,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: isActive ? AppTheme.primaryColor : Colors.grey.shade200),
          ),
          child: Text(label, style: TextStyle(color: isActive ? Colors.white : Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }

  Widget _buildTableBarChart(Map<int, int> tableUsage) {
    if (tableUsage.isEmpty) return const Center(child: Text('Sin datos de mesas', style: TextStyle(color: Colors.grey)));
    
    return BarChart(
      BarChartData(
        gridData: const FlGridData(show: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text('M${value.toInt()}', style: const TextStyle(fontSize: 9, color: Colors.grey)),
            ),
          ),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        barGroups: tableUsage.entries.map((e) => BarChartGroupData(
          x: e.key,
          barRods: [
            BarChartRodData(
              toY: e.value.toDouble(),
              color: AppTheme.primaryColor,
              width: 12,
              borderRadius: BorderRadius.circular(4),
            ),
          ],
        )).toList()..sort((a, b) => a.x.compareTo(b.x)),
      ),
    );
  }

  Widget _buildFilterChip(String label, bool active) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: active ? AppTheme.primaryColor : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: active ? AppTheme.primaryColor : Colors.grey.shade200),
      ),
      child: Text(label, style: TextStyle(color: active ? Colors.white : Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildMetricMiniCard(String title, String value, String growth, IconData icon, Color color, {double? width}) {
    return Container(
      width: width,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                  child: Text(growth, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required String title, String? subtitle, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          if (subtitle != null) Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 24),
          child,
        ],
      ),
    );
  }

  Widget _buildLineChart(List<double> hourlySales) {
    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                if (value % 4 == 0) return Text('${value.toInt()}h', style: const TextStyle(fontSize: 10, color: Colors.grey));
                return const SizedBox();
              },
            ),
          ),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            isCurved: true,
            color: AppTheme.primaryColor,
            barWidth: 4,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(show: true, color: AppTheme.primaryColor.withOpacity(0.1)),
            spots: hourlySales.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTopProductItem(String title, double percentage, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text('${percentage.toInt()}%', style: TextStyle(color: color, fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(value: percentage / 100, backgroundColor: Colors.grey.shade100, valueColor: AlwaysStoppedAnimation<Color>(color), minHeight: 6),
        ],
      ),
    );
  }
}
