import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/models/user_model.dart';

class MainShell extends ConsumerWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final GoRouterState state  = GoRouterState.of(context);
    final String activeRoute   = state.uri.path;
    final authState              = ref.watch(authProvider);
    final UserModel? user        = authState.valueOrNull;

    return Scaffold(
      backgroundColor: AppTheme.lightGray,
      body: Row(
        children: [
          // ── Sidebar oscuro ────────────────────────────────────────────────
          _SideNavBar(activeRoute: activeRoute),

          // ── Área principal ────────────────────────────────────────────────
          Expanded(
            child: Column(
              children: [
                _TopBar(user: user),
                Expanded(
                  child: Container(
                    color: AppTheme.lightGray,
                    child: child,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
class _TopBar extends StatelessWidget {
  final UserModel? user;
  const _TopBar({required this.user});

  String get _displayName {
    if (user?.nombre != null && user!.nombre.isNotEmpty) {
      return user!.nombre;
    }
    if (user?.email != null && user!.email.isNotEmpty) {
      return user!.email.split('@').first;
    }
    return 'Admin';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      decoration: const BoxDecoration(
        color: AppTheme.white,
        border: Border(bottom: BorderSide(color: AppTheme.borderGray, width: 1)),
      ),
      child: Row(
        children: [
          // ── Título de la sección actual ───────────────────────────────────
          _SectionTitle(path: GoRouterState.of(context).uri.path),

          const Spacer(),

          // ── Barra de búsqueda ─────────────────────────────────────────────
          SizedBox(
            width: 280,
            height: 38,
            child: TextField(
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Buscar mesa, producto...',
                hintStyle:
                    const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                prefixIcon: const Icon(Icons.search_rounded,
                    color: AppTheme.textMuted, size: 18),
                filled: true,
                fillColor: AppTheme.lightGray,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide:
                      const BorderSide(color: AppTheme.borderGray),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide:
                      const BorderSide(color: AppTheme.borderGray),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(
                      color: AppTheme.primaryColor, width: 1.5),
                ),
              ),
            ),
          ),

          const SizedBox(width: 16),

          // ── Notificaciones ────────────────────────────────────────────────
          _NotifButton(),

          const SizedBox(width: 16),

          // ── Perfil ────────────────────────────────────────────────────────
          _UserAvatar(displayName: _displayName, user: user, context: context),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String path;
  const _SectionTitle({required this.path});

  String get _title {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/mesas':     return 'Gestión de Mesas';
      case '/kitchen':   return 'Vista Cocina';
      case '/orders':    return 'Pedidos';
      case '/reports':   return 'Reportes';
      case '/billing':   return 'Facturación';
      default:           return 'Mr. Pepe';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      _title,
      style: const TextStyle(
        fontFamily: 'Inter',
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: AppTheme.black,
      ),
    );
  }
}

class _NotifButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sin notificaciones nuevas'),
          duration: Duration(seconds: 2),
        ),
      ),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppTheme.lightGray,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.borderGray),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.notifications_none_rounded,
                color: AppTheme.black, size: 20),
            Positioned(
              top: 7,
              right: 7,
              child: Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UserAvatar extends StatelessWidget {
  final String displayName;
  final UserModel? user;
  final BuildContext context;
  const _UserAvatar(
      {required this.displayName, required this.user, required this.context});

  @override
  Widget build(BuildContext _) {
    return GestureDetector(
      onTap: () => _showMenu(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.lightGray,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.borderGray),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: AppTheme.primaryColor,
              child: Text(
                displayName.isNotEmpty
                    ? displayName[0].toUpperCase()
                    : 'A',
                style: const TextStyle(
                    color: AppTheme.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 12),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              displayName,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.black,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down_rounded,
                size: 16, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }

  void _showMenu(BuildContext ctx) {
    showMenu<String>(
      context: ctx,
      position: const RelativeRect.fromLTRB(1000, 64, 28, 0),
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      items: [
        PopupMenuItem<String>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(displayName,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 14)),
              if (user?.email != null && user!.email.isNotEmpty)
                Text(user!.email,
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: [
              Icon(Icons.logout_rounded, color: Colors.red, size: 18),
              SizedBox(width: 10),
              Text('Cerrar Sesión',
                  style: TextStyle(color: Colors.red, fontSize: 13)),
            ],
          ),
        ),
      ],
    ).then((value) {
      if (value == 'logout') ctx.go('/login');
    });
  }
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
class _SideNavBar extends StatelessWidget {
  final String activeRoute;
  const _SideNavBar({required this.activeRoute});

  static const List<_NavItem> _items = [
    _NavItem(Icons.grid_view_rounded, 'Dashboard', '/dashboard'),
    _NavItem(Icons.table_restaurant_rounded, 'Mesas', '/mesas'),
    _NavItem(Icons.restaurant_rounded, 'Cocina', '/kitchen'),
    _NavItem(Icons.receipt_long_rounded, 'Pedidos', '/orders'),
    _NavItem(Icons.bar_chart_rounded, 'Reportes', '/reports'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      height: MediaQuery.of(context).size.height,
      decoration: const BoxDecoration(
        gradient: AppTheme.sidebarGradient,
        border: Border(right: BorderSide(color: Color(0xFF2A2A2A), width: 1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
            child: Row(children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(9),
                  child: Image.asset(
                    'assets/images/mr_pepe_logo.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.local_fire_department_rounded,
                      color: AppTheme.primaryColor,
                      size: 20,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 11),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('MR. PEPE',
                    style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.white,
                        letterSpacing: 0.5)),
                Text('Sistema POS',
                    style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 10,
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w400)),
              ]),
            ]),
          ),

          Container(height: 1, color: const Color(0xFF262626)),
          const SizedBox(height: 14),

          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 0, 8),
            child: Text('NAVEGACIÓN',
                style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted.withOpacity(0.7),
                    letterSpacing: 1.5)),
          ),

          for (final item in _items) _buildItem(context, item),

          const Spacer(),
          Container(height: 1, color: const Color(0xFF262626)),
          const SizedBox(height: 10),

          // Logout
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 0, 10, 16),
            child: InkWell(
              onTap: () => context.go('/login'),
              borderRadius: BorderRadius.circular(9),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 11),
                child: Row(children: [
                  const Icon(Icons.logout_rounded,
                      color: AppTheme.textMuted, size: 19),
                  const SizedBox(width: 12),
                  Text('Cerrar Sesión',
                      style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w500)),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(BuildContext context, _NavItem item) {
    final bool isActive = activeRoute == item.route;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 1.5),
      child: InkWell(
        onTap: () => context.go(item.route),
        borderRadius: BorderRadius.circular(9),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: isActive
                ? AppTheme.primaryColor.withOpacity(0.16)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
            border: Border.all(
              color: isActive
                  ? AppTheme.primaryColor.withOpacity(0.3)
                  : Colors.transparent,
            ),
          ),
          child: Row(children: [
            Container(
              width: 3,
              height: 16,
              decoration: BoxDecoration(
                color: isActive
                    ? AppTheme.primaryColor
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 10),
            Icon(item.icon,
                color:
                    isActive ? AppTheme.primaryColor : AppTheme.textMuted,
                size: 19),
            const SizedBox(width: 11),
            Text(item.label,
                style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: isActive
                        ? FontWeight.w600
                        : FontWeight.w400,
                    color: isActive
                        ? AppTheme.white
                        : AppTheme.textMuted)),
          ]),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  const _NavItem(this.icon, this.label, this.route);
}
