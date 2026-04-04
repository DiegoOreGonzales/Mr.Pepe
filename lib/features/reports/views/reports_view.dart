import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_theme.dart';

class ReportsView extends StatelessWidget {
  const ReportsView({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
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
                  Text('Reportes', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppTheme.primaryColor)),
                  Text('Admin Management Panel', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
              Row(
                children: [
                  _buildFilterChip('HOY', true),
                  _buildFilterChip('ESTA SEMANA', false),
                  _buildFilterChip('ESTE MES', false),
                ],
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Top Metric Cards
          Row(
            children: [
              Expanded(child: _buildMetricMiniCard('Total ventas', 'S/ 2,450', '+12%', Icons.payments, Colors.orange)),
              const SizedBox(width: 16),
              Expanded(child: _buildMetricMiniCard('Ticket promedio', 'S/ 32.50', '+5%', Icons.confirmation_number, Colors.blue)),
              const SizedBox(width: 16),
              Expanded(child: _buildMetricMiniCard('Pedidos', '28', 'hoy', Icons.shopping_bag, Colors.purple)),
              const SizedBox(width: 16),
              Expanded(child: _buildMetricMiniCard('Mesas rotación', '2.3', 'Óptimo', Icons.table_restaurant, Colors.green)),
            ],
          ),
          const SizedBox(height: 32),

          // Charts Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Sales Flow Chart
              Expanded(
                flex: 2,
                child: _buildCard(
                  title: 'Flujo de Ventas',
                  subtitle: 'Rendimiento por hora (S/)',
                  child: SizedBox(
                    height: 300,
                    child: _buildLineChart(),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              // Top Products
              Expanded(
                child: _buildCard(
                  title: 'Más vendidos',
                  child: Column(
                    children: [
                      _buildTopProductItem('Pollo', 92, Colors.orange),
                      _buildTopProductItem('Papas', 80, Colors.blue),
                      _buildTopProductItem('Chicha', 72, Colors.purple),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Waiter Ranking
          _buildCard(
            title: 'Ventas por mesero',
            subtitle: 'RANKING DE EFICIENCIA',
            child: Row(
              children: [
                _buildWaiterItem('Maria González', 'S/ 840.0', 1, '98%'),
                const SizedBox(width: 24),
                _buildWaiterItem('Jorge Luna', 'S/ 720.5', 2, '94%'),
                const SizedBox(width: 24),
                _buildWaiterItem('Lucía Ferreyra', 'S/ 615.0', 3, '96%'),
              ],
            ),
          ),
        ],
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

  Widget _buildMetricMiniCard(String title, String value, String growth, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
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
              Icon(icon, color: color, size: 24),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                child: Text(growth, style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
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

  Widget _buildLineChart() {
    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            isCurved: true,
            color: AppTheme.primaryColor,
            barWidth: 4,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(show: true, color: AppTheme.primaryColor.withOpacity(0.1)),
            spots: const [
              FlSpot(0, 3),
              FlSpot(1, 1),
              FlSpot(2, 4),
              FlSpot(3, 2),
              FlSpot(4, 5),
              FlSpot(5, 3),
            ],
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

  Widget _buildWaiterItem(String name, String amount, int rank, String satisfaction) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.orange.shade50.withOpacity(0.3), borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            CircleAvatar(radius: 20, backgroundColor: AppTheme.primaryColor, child: Text('$rank', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(amount, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                Text(satisfaction, style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
