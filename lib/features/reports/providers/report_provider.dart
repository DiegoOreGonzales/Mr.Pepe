import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../kitchen/models/order_model.dart';

class ReportMetrics {
  final double totalSales;
  final double averageTicket;
  final int totalOrders;
  final List<double> hourlySales;
  final Map<int, int> tableUsage;

  ReportMetrics({
    required this.totalSales,
    required this.averageTicket,
    required this.totalOrders,
    required this.hourlySales,
    required this.tableUsage,
  });
}

enum ReportPeriod { hoy, semana, mes }

final reportPeriodProvider = StateProvider<ReportPeriod>((ref) => ReportPeriod.hoy);

final reportMetricsProvider = StreamProvider<ReportMetrics>((ref) {
  final firestore = FirebaseFirestore.instance;
  final period = ref.watch(reportPeriodProvider);
  final now = DateTime.now();
  
  DateTime startDate;
  switch (period) {
    case ReportPeriod.hoy:
      startDate = DateTime(now.year, now.month, now.day);
      break;
    case ReportPeriod.semana:
      startDate = now.subtract(const Duration(days: 7));
      break;
    case ReportPeriod.mes:
      startDate = DateTime(now.year, now.month, 1);
      break;
  }

  return firestore
      .collection('orders')
      .where('status', whereIn: [OrderStatus.pagado.name, OrderStatus.entregado.name])
      .where('createdAt', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
      .snapshots()
      .map((snapshot) {
    final orders = snapshot.docs.map((doc) => OrderModel.fromFirestore(doc)).toList();
    
    double total = 0;
    List<double> hourly = List.filled(24, 0.0);
    Map<int, int> usage = {};
    
    for (var order in orders) {
      total += order.total;
      int hour = order.createdAt.hour;
      if (hour < 24) hourly[hour] += order.total;
      
      usage[order.mesaNumero] = (usage[order.mesaNumero] ?? 0) + 1;
    }

    return ReportMetrics(
      totalSales: total,
      totalOrders: orders.length,
      averageTicket: orders.isEmpty ? 0 : total / orders.length,
      hourlySales: hourly,
      tableUsage: usage,
    );
  });
});
