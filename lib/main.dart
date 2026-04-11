import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/main_shell.dart';
import 'features/tables/views/mesa_grid_view.dart';
import 'features/auth/views/login_view.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/dashboard/views/dashboard_view.dart';
import 'features/kitchen/views/kitchen_view.dart';
import 'features/billing/views/billing_view.dart';
import 'features/tables/models/mesa_model.dart';
import 'features/reports/views/reports_view.dart';
import 'features/digital_menu/views/digital_menu_view.dart';
import 'features/orders/views/orders_list_view.dart';
import 'features/tables/views/qr_grid_view.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(
    const ProviderScope(
      child: MrPepeApp(),
    ),
  );
}

final _routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      // Usamos valueOrNull para evitar excepciones si el estado es de error
      final user = authState.valueOrNull;
      final isLoggedIn = user != null;
      final isLoggingIn = state.uri.path == '/login';
      final isPublic = state.uri.path.startsWith('/menu') || state.uri.path == '/print-qr';
      
      if (!isLoggedIn && !isLoggingIn && !isPublic) return '/login';
      if (isLoggedIn && isLoggingIn) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginView(),
      ),
      GoRoute(
        path: '/menu/:mesa',
        builder: (context, state) {
          final mesa = int.parse(state.pathParameters['mesa'] ?? '1');
          return DigitalMenuView(mesaNumero: mesa);
        },
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (context, state) => const DashboardView()),
          GoRoute(path: '/mesas', builder: (context, state) => const MesaGridView()),
          GoRoute(path: '/kitchen', builder: (context, state) => const KitchenView()),
          GoRoute(path: '/reports', builder: (context, state) => const ReportsView()),
          GoRoute(path: '/orders', builder: (context, state) => const OrdersListView()),
          GoRoute(
            path: '/billing',
            builder: (context, state) {
              final mesa = state.extra as Mesa;
              return BillingView(mesa: mesa);
            },
          ),
          GoRoute(
            path: '/print-qr',
            builder: (context, state) => const QrGridView(),
          ),
        ],
      ),
    ],
  );
});

class MrPepeApp extends ConsumerWidget {
  const MrPepeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(_routerProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Mr. Pepe',
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
