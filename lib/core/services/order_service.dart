import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/orders/providers/order_provider.dart';
import 'api_service.dart';

class OrderService {
  final ApiService _apiService;

  OrderService(this._apiService);

  Future<void> submitOrder({
    required int mesaNumero,
    required List<CartItem> items,
    required double total,
  }) async {
    await _apiService.submitOrder(
      mesaNumero: mesaNumero,
      items: items,
      total: total,
    );
  }
}

final orderServiceProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  return OrderService(api);
});
