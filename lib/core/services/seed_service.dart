import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_service.dart';

class SeedService {
  static Future<void> seedDefaultAdmin() async {
    final auth = FirebaseAuth.instance;
    final firestore = FirebaseFirestore.instance;

    const String email = 'admin@elbrasero.com';
    const String password = 'admin123456';

    try {
      // Intentar crear el usuario
      UserCredential userCredential = await auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Guardar el rol en Firestore
      await firestore.collection('users').doc(userCredential.user!.uid).set({
        'nombre': 'Administrador Principal',
        'email': email,
        'role': 'admin',
        'createdAt': FieldValue.serverTimestamp(),
      });
      
      print('Usuario administrador creado con éxito');
    } on FirebaseAuthException catch (e) {
      if (e.code == 'email-already-in-use') {
        print('El usuario ya existe en Auth, intentando asegurar documento en Firestore...');
        // Iniciar sesión temporalmente para obtener el UID y asegurar el documento
        final userCredential = await auth.signInWithEmailAndPassword(email: email, password: password);
        await firestore.collection('users').doc(userCredential.user!.uid).set({
          'nombre': 'Administrador Principal',
          'email': email,
          'role': 'admin',
          'createdAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
        print('Documento de administrador asegurado.');
      } else {
        rethrow;
      }
    }
  }

  static Future<void> initializeSystem(FirebaseService firebaseService) async {
    await seedDefaultAdmin();
    await firebaseService.seedTables();
  }
}
