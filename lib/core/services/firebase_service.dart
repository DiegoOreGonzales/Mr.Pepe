import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/tables/models/mesa_model.dart';
import 'api_service.dart';

class FirebaseService {
  final ApiService _apiService;

  FirebaseService(this._apiService);

  // Escuchar cambios de las mesas simulado mediante Short Polling reactivo (cada 3 segundos)
  Stream<List<Mesa>> getTablesStream() {
    return Stream.periodic(const Duration(seconds: 3))
        .asyncMap((_) => _apiService.fetchTables());
  }

  Future<void> updateTableStatus(String id, MesaStatus status, {String? encargado}) async {
    await _apiService.updateTableStatus(id, status, encargado: encargado);
  }

  // Las mesas se inicializan automáticamente en la base de datos PostgreSQL mediante Docker init.sql
  Future<void> seedTables() async {
    // No-op (ya inicializado en Postgres)
  }
}

final firebaseServiceProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  return FirebaseService(api);
});
