import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../models/order_model.dart';

final kitchenProvider = StreamProvider<List<OrderModel>>((ref) {
  final api = ref.watch(apiServiceProvider);
  return Stream.periodic(const Duration(seconds: 3))
      .asyncMap((_) => api.fetchActiveOrders());
});

class KitchenService {
  final ApiService _apiService;

  KitchenService(this._apiService);

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    await _apiService.updateOrderStatus(orderId, newStatus);
  }
}

final kitchenServiceProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  return KitchenService(api);
});
