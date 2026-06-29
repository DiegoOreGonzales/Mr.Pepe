import 'firebase_service.dart';

class SeedService {
  static Future<void> seedDefaultAdmin() async {
    // Ya inicializado automáticamente en PostgreSQL local a través de init.sql
  }

  static Future<void> initializeSystem(FirebaseService firebaseService) async {
    // Ya inicializado automáticamente en PostgreSQL local a través de init.sql
  }
}
