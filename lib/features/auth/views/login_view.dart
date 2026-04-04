import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../../../core/services/seed_service.dart';
import '../../../core/services/firebase_service.dart';
import '../../kitchen/views/kitchen_view.dart';

class LoginView extends ConsumerStatefulWidget {
  const LoginView({super.key});

  @override
  ConsumerState<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends ConsumerState<LoginView> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    
    if (email.isEmpty || password.isEmpty) return;
    
    await ref.read(authProvider.notifier).signIn(email, password);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.emberGradient,
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo / Icon
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)
                    ],
                  ),
                  child: const Icon(Icons.restaurant_menu, size: 60, color: AppTheme.primaryColor),
                ),
                const SizedBox(height: 24),
                Text(
                  'El Brasero',
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                const Text(
                  'SISTEMA DE GESTIÓN',
                  style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 4),
                ),
                const SizedBox(height: 60),
                // Login Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    children: [
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          hintText: 'Email',
                          prefixIcon: const Icon(Icons.email_outlined),
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          hintText: 'Contraseña',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton(
                          onPressed: authState.isLoading ? null : _handleLogin,
                          child: authState.isLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text('INGRESAR', style: TextStyle(fontSize: 16, letterSpacing: 2)),
                        ),
                      ),
                      if (authState.hasError)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Text(
                            'Error: ${authState.error.toString().split(']').last.trim()}',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.bold),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const KitchenView()),
                  ),
                  child: const Text('MODO COCINA (ACCESO RÁPIDO)', style: TextStyle(color: Colors.white70)),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final firebaseService = ref.read(firebaseServiceProvider);
          await SeedService.initializeSystem(firebaseService);
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Sistema Inicializado: admin@elbrasero.com / admin123456')),
          );
        },
        child: const Icon(Icons.settings),
      ),
    );
  }
}
