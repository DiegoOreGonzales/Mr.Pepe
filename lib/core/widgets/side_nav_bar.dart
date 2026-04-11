import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import 'brasa_logo.dart';

class SideNavBar extends StatelessWidget {
  final String activeRoute;
  const SideNavBar({super.key, required this.activeRoute});

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
        border: Border(
          right: BorderSide(color: Color(0xFF2A2A2A), width: 1),
        ),
      ),
      child: Column(
        children: [
          // ── Logo ─────────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.asset(
                      'assets/images/mr_pepe_logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.local_fire_department_rounded,
                        color: AppTheme.primaryColor,
                        size: 22,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'MR. PEPE',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      'Sistema POS',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 10,
                        fontWeight: FontWeight.w400,
                        color: AppTheme.primaryColor,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Divisor ──────────────────────────────────────────────────────
          Container(
            height: 1,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            color: const Color(0xFF2A2A2A),
          ),
          const SizedBox(height: 16),

          // ── Etiqueta sección ─────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'MENÚ PRINCIPAL',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMuted,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),

          // ── Nav Items ────────────────────────────────────────────────────
          for (final item in _items)
            _buildNavItem(context, item),

          const Spacer(),

          // ── Divisor ──────────────────────────────────────────────────────
          Container(
            height: 1,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            color: const Color(0xFF2A2A2A),
          ),
          const SizedBox(height: 12),

          // ── Logout ───────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
            child: InkWell(
              onTap: () => context.go('/login'),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.logout_rounded,
                      color: AppTheme.textMuted,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Cerrar Sesión',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, _NavItem item) {
    final bool isActive = activeRoute == item.route;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: InkWell(
        onTap: () => context.go(item.route),
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
          decoration: BoxDecoration(
            color: isActive
                ? AppTheme.primaryColor.withOpacity(0.18)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: isActive
                ? Border.all(
                    color: AppTheme.primaryColor.withOpacity(0.35), width: 1)
                : Border.all(color: Colors.transparent),
          ),
          child: Row(
            children: [
              // Indicador activo
              Container(
                width: 3,
                height: 18,
                decoration: BoxDecoration(
                  color: isActive ? AppTheme.primaryColor : Colors.transparent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Icon(
                item.icon,
                color:
                    isActive ? AppTheme.primaryColor : AppTheme.textMuted,
                size: 20,
              ),
              const SizedBox(width: 12),
              Text(
                item.label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight:
                      isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive ? AppTheme.white : AppTheme.textMuted,
                ),
              ),
            ],
          ),
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
