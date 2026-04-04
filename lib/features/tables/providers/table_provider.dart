import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/mesa_model.dart';
import '../../../core/services/firebase_service.dart';

final tableProvider = StateNotifierProvider<TableNotifier, List<Mesa>>((ref) {
  final firebaseService = ref.watch(firebaseServiceProvider);
  return TableNotifier(firebaseService);
});

class TableNotifier extends StateNotifier<List<Mesa>> {
  final FirebaseService _firebaseService;

  TableNotifier(this._firebaseService) : super([]) {
    _listenToTables();
  }

  void _listenToTables() {
    _firebaseService.getTablesStream().listen((tables) {
      state = tables;
      // Si está vacío, intentar el seed inicial (Solo la primera vez)
      if (tables.isEmpty) {
        _firebaseService.seedTables();
      }
    });
  }

  Future<void> updateTableStatus(String id, MesaStatus newStatus, {String? encargado}) async {
    await _firebaseService.updateTableStatus(id, newStatus, encargado: encargado);
  }
}
