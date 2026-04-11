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
  final _emailController    = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword     = true;
  final _formKey            = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email    = _emailController.text.trim();
    final password = _passwordController.text.trim();
    if (email.isEmpty || password.isEmpty) return;
    await ref.read(authProvider.notifier).signIn(email, password);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: Row(
        children: [
          // ── Panel izquierdo (branding oscuro) ─────────────────────────────
          Expanded(
            flex: 5,
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppTheme.sidebarGradient,
              ),
              child: Stack(
                children: [
                  // Patrón decorativo
                  Positioned(
                    right: -60,
                    top: -60,
                    child: Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.primaryColor.withOpacity(0.08),
                      ),
                    ),
                  ),
                  Positioned(
                    left: -40,
                    bottom: -40,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.primaryColor.withOpacity(0.05),
                      ),
                    ),
                  ),
                  // Contenido
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(48),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 20,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Image.asset(
                                'assets/images/mr_pepe_logo.png',
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.local_fire_department_rounded,
                                  color: AppTheme.primaryColor,
                                  size: 50,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),
                          const Text(
                            'Mr. Pepe',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 38,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Sistema de gestión para\npollerías y parrillas',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 15,
                              color: Color(0xFF888888),
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 48),

                          // Features
                          _FeatureItem(
                            icon: Icons.table_restaurant_rounded,
                            text: 'Gestión de mesas en tiempo real',
                          ),
                          const SizedBox(height: 14),
                          _FeatureItem(
                            icon: Icons.receipt_long_rounded,
                            text: 'Pedidos y facturación electrónica',
                          ),
                          const SizedBox(height: 14),
                          _FeatureItem(
                            icon: Icons.restaurant_rounded,
                            text: 'Panel de cocina actualizable',
                          ),
                          const SizedBox(height: 14),
                          _FeatureItem(
                            icon: Icons.bar_chart_rounded,
                            text: 'Reportes y analíticas de ventas',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Panel derecho (formulario) ────────────────────────────────────
          Expanded(
            flex: 4,
            child: Container(
              color: AppTheme.white,
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 48, vertical: 32),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 380),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Bienvenido',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.black,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Ingresa tus credenciales para continuar',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 13,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 36),

                        // Email
                        const Text(
                          'CORREO ELECTRÓNICO',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textMuted,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          onSubmitted: (_) => _handleLogin(),
                          style: const TextStyle(
                              fontFamily: 'Inter', fontSize: 14),
                          decoration: const InputDecoration(
                            hintText: 'admin@elbrasero.com',
                            prefixIcon: Icon(Icons.email_outlined,
                                size: 18, color: AppTheme.textMuted),
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Contraseña
                        const Text(
                          'CONTRASEÑA',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textMuted,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          onSubmitted: (_) => _handleLogin(),
                          style: const TextStyle(
                              fontFamily: 'Inter', fontSize: 14),
                          decoration: InputDecoration(
                            hintText: '••••••••',
                            prefixIcon: const Icon(Icons.lock_outline,
                                size: 18, color: AppTheme.textMuted),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                size: 18,
                                color: AppTheme.textMuted,
                              ),
                              onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                        ),
                        const SizedBox(height: 28),

                        // Botón ingresar
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed:
                                authState.isLoading ? null : _handleLogin,
                            child: authState.isLoading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                        color: AppTheme.white, strokeWidth: 2),
                                  )
                                : const Text('INGRESAR AL SISTEMA',
                                    style: TextStyle(
                                        letterSpacing: 0.8, fontSize: 13)),
                          ),
                        ),

                        if (authState.hasError) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: AppTheme.primaryColor.withOpacity(0.2)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline,
                                    color: AppTheme.primaryColor, size: 16),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    authState.error
                                        .toString()
                                        .split(']')
                                        .last
                                        .trim(),
                                    style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 12,
                                        color: AppTheme.primaryColor),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 24),
                        const Divider(color: AppTheme.borderGray),
                        const SizedBox(height: 16),

                        // Acceso rápido cocina
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => const KitchenView()),
                            ),
                            icon: const Icon(Icons.restaurant_rounded, size: 16),
                            label: const Text('Acceso Directo — Modo Cocina'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: AppTheme.darkSurface,
        foregroundColor: AppTheme.white,
        tooltip: 'Inicializar sistema',
        onPressed: () async {
          final firebaseService = ref.read(firebaseServiceProvider);
          await SeedService.initializeSystem(firebaseService);
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Sistema inicializado — admin@elbrasero.com / admin123456'),
              backgroundColor: Color(0xFF1A8952),
            ),
          );
        },
        child: const Icon(Icons.settings_rounded, size: 18),
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String text;
  const _FeatureItem({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppTheme.primaryColor, size: 16),
        ),
        const SizedBox(width: 12),
        Text(
          text,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            color: Color(0xFFAAAAAA),
          ),
        ),
      ],
    );
  }
}
