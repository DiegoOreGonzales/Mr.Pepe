import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/tables/models/mesa_model.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Escuchar cambios en tiempo real de las mesas
  Stream<List<Mesa>> getTablesStream() {
    return _firestore.collection('tables').orderBy('numero').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data();
        return Mesa(
          id: doc.id,
          numero: data['numero'] ?? 0,
          capacidad: data['capacidad'] ?? 4,
          status: _statusFromString(data['status']),
          encargado: data['encargado'],
          tiempoOcupada: data['startTime'] != null 
            ? DateTime.now().difference((data['startTime'] as Timestamp).toDate())
            : null,
        );
      }).toList();
    });
  }

  MesaStatus _statusFromString(String? status) {
    switch (status) {
      case 'ocupada': return MesaStatus.ocupada;
      case 'reservada': return MesaStatus.reservada;
      default: return MesaStatus.libre;
    }
  }

  Future<void> updateTableStatus(String id, MesaStatus status, {String? encargado}) async {
    await _firestore.collection('tables').doc(id).update({
      'status': status.name,
      'encargado': encargado,
      'startTime': status == MesaStatus.ocupada ? FieldValue.serverTimestamp() : null,
    });
  }

  // Inicializar mesas si la colección está vacía (Seed)
  Future<void> seedTables() async {
    final snapshot = await _firestore.collection('tables').get();
    if (snapshot.docs.isEmpty) {
      for (int i = 1; i <= 40; i++) {
        await _firestore.collection('tables').doc('mesa_$i').set({
          'numero': i,
          'capacidad': 4,
          'status': 'libre',
          'encargado': null,
          'startTime': null,
        });
      }
    }
  }
}

final firebaseServiceProvider = Provider((ref) => FirebaseService());
