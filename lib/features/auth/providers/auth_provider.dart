import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  AuthNotifier() : super(const AsyncValue.loading()) {
    _init();
  }

  void _init() {
    _auth.authStateChanges().listen((user) async {
      try {
        if (user == null) {
          state = const AsyncValue.data(null);
        } else {
          final doc = await _firestore.collection('users').doc(user.uid).get();
          if (doc.exists) {
            state = AsyncValue.data(UserModel.fromMap(user.uid, doc.data()!));
          } else {
            state = const AsyncValue.data(null);
          }
        }
      } catch (e, st) {
        state = AsyncValue.error(e, st);
      }
    });
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      await _auth
          .signInWithEmailAndPassword(email: email, password: password)
          .timeout(const Duration(seconds: 10));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
