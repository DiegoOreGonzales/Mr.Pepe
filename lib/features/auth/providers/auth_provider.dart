import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../models/user_model.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AuthNotifier(api);
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(const AsyncValue.data(null)) {
    _init();
  }

  void _init() {
    if (_apiService.currentUser != null) {
      state = AsyncValue.data(_apiService.currentUser);
    } else {
      state = const AsyncValue.data(null);
    }
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _apiService.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> signOut() async {
    _apiService.logout();
    state = const AsyncValue.data(null);
  }

  void clearError() {
    state = const AsyncValue.data(null);
  }
}
