import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/tables/models/mesa_model.dart';
import '../../features/kitchen/models/order_model.dart';
import '../../features/orders/providers/order_provider.dart';

class ApiService {
  static const String defaultIp = '192.168.1.13:3000';
  String _currentServerIp = defaultIp;
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://$defaultIp',
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 5),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  ));

  ApiService() {
    _loadSavedServerIp();
  }

  String get serverIp => _currentServerIp;

  Future<void> _loadSavedServerIp() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedIp = prefs.getString('server_ip');
      if (savedIp != null && savedIp.isNotEmpty) {
        _currentServerIp = savedIp;
        _dio.options.baseUrl = 'http://$_currentServerIp';
        print('IP del servidor cargada: $_currentServerIp');
      }
    } catch (e) {
      print('Error al cargar IP de servidor: $e');
    }
  }

  Future<void> setServerIp(String newIp) async {
    if (newIp.isEmpty) return;
    if (!newIp.contains(':')) {
      newIp = '$newIp:3000';
    }
    _currentServerIp = newIp;
    _dio.options.baseUrl = 'http://$_currentServerIp';
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_ip', _currentServerIp);
    } catch (e) {
      print('Error al guardar IP de servidor: $e');
    }
  }

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;

  // 1. Autenticación
  Future<UserModel?> login(String email, String password) async {
    try {
      final response = await _dio.post('/api/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final userData = response.data['user'];
        _currentUser = UserModel(
          uid: userData['uid'],
          nombre: userData['nombre'],
          email: userData['email'],
          role: userData['role'] ?? 'user',
        );
        return _currentUser;
      }
    } catch (e) {
      print('Error en login API: $e');
      rethrow;
    }
    return null;
  }

  void logout() {
    _currentUser = null;
  }

  // 2. Gestión de Mesas
  Future<List<Mesa>> fetchTables() async {
    try {
      final response = await _dio.get('/api/tables');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        return list.map((item) {
          return Mesa(
            id: item['id'],
            numero: item['numero'] ?? 0,
            capacidad: item['capacidad'] ?? 4,
            status: _statusFromString(item['status']),
            encargado: item['encargado'],
            tiempoOcupada: item['startTime'] != null
                ? DateTime.now().difference(DateTime.parse(item['startTime']))
                : null,
          );
        }).toList();
      }
    } catch (e) {
      print('Error al obtener mesas: $e');
    }
    return [];
  }

  MesaStatus _statusFromString(String? status) {
    switch (status) {
      case 'ocupada': return MesaStatus.ocupada;
      case 'reservada': return MesaStatus.reservada;
      default: return MesaStatus.libre;
    }
  }

  Future<void> updateTableStatus(String id, MesaStatus status, {String? encargado}) async {
    try {
      await _dio.put('/api/tables', data: {
        'id': id,
        'status': status.name,
        'encargado': encargado,
      });
    } catch (e) {
      print('Error al actualizar estado de mesa: $e');
      rethrow;
    }
  }

  // 3. Gestión de Pedidos
  Future<void> submitOrder({
    required int mesaNumero,
    required List<CartItem> items,
    required double total,
  }) async {
    try {
      final List<Map<String, dynamic>> itemsMap = items.map((item) => {
        'productId': item.producto.id,
        'nombre': item.producto.nombre,
        'cantidad': item.cantidad,
        'precio': item.producto.precio,
        'notas': null,
      }).toList();

      await _dio.post('/api/orders', data: {
        'mesaNumero': mesaNumero,
        'items': itemsMap,
        'total': total,
      });
    } catch (e) {
      print('Error al crear orden: $e');
      rethrow;
    }
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    try {
      await _dio.put('/api/orders', data: {
        'id': orderId,
        'status': newStatus.name,
      });
    } catch (e) {
      print('Error al cambiar estado de orden: $e');
      rethrow;
    }
  }

  Future<void> checkoutOrder({
    required String orderId,
    required String clienteNombre,
    required String? clienteDocumento,
    required String tipoDocumento,
    required String voucherNumber,
  }) async {
    try {
      await _dio.put('/api/orders', data: {
        'id': orderId,
        'status': 'pagado',
        'clienteNombre': clienteNombre,
        'clienteDocumento': clienteDocumento,
        'tipoDocumento': tipoDocumento,
        'voucherNumber': voucherNumber,
      });
    } catch (e) {
      print('Error al procesar cobro de orden: $e');
      rethrow;
    }
  }

  Future<List<OrderModel>> fetchRecentOrders() async {
    try {
      final response = await _dio.get('/api/orders?limit=7');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        return list.map((item) => _orderFromMap(item)).toList();
      }
    } catch (e) {
      print('Error al obtener órdenes recientes: $e');
    }
    return [];
  }

  Future<List<OrderModel>> fetchActiveOrders() async {
    try {
      final response = await _dio.get('/api/orders?status=active');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        return list.map((item) => _orderFromMap(item)).toList();
      }
    } catch (e) {
      print('Error al obtener órdenes activas: $e');
    }
    return [];
  }

  Future<List<OrderModel>> fetchReportOrders() async {
    try {
      final response = await _dio.get('/api/orders?status=billing');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        return list.map((item) => _orderFromMap(item)).toList();
      }
    } catch (e) {
      print('Error al obtener órdenes de reportes: $e');
    }
    return [];
  }

  OrderModel _orderFromMap(Map<String, dynamic> map) {
    final List rawItems = map['items'] ?? [];
    return OrderModel(
      id: map['id'],
      mesaNumero: map['mesaNumero'] ?? 0,
      items: rawItems.map((i) => OrderItem.fromMap(i)).toList(),
      status: _orderStatusFromString(map['status']),
      createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : DateTime.now(),
      total: (map['total'] ?? 0.0).toDouble(),
    );
  }

  OrderStatus _orderStatusFromString(String? status) {
    switch (status) {
      case 'preparando': return OrderStatus.preparando;
      case 'listo': return OrderStatus.listo;
      case 'entregado': return OrderStatus.entregado;
      case 'pagado': return OrderStatus.pagado;
      default: return OrderStatus.pendiente;
    }
  }

  // 4. Alertas / Notificaciones
  Future<void> sendAlert(int mesa) async {
    try {
      await _dio.post('/api/alerts', data: {
        'type': 'call_waiter',
        'mesa': mesa,
      });
    } catch (e) {
      print('Error al enviar alerta de mozo: $e');
      rethrow;
    }
  }
}

final apiServiceProvider = Provider((ref) => ApiService());
