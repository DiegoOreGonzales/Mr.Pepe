import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import 'brasa_logo.dart';

class SideNavBar extends StatelessWidget {
  final String activeRoute;
  const SideNavBar({super.key, required this.activeRoute});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 90,
      height: MediaQuery.of(context).size.height,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 0),
      child: Column(
        children: [
          const SizedBox(height: 60), // Increased margin since logo is gone
          _buildNavItem(context, Icons.grid_view_rounded, 'Home', '/dashboard'),
          const SizedBox(height: 8),
          _buildNavItem(context, Icons.restaurant_menu_rounded, 'Mesas', '/mesas'),
          const SizedBox(height: 8),
          _buildNavItem(context, Icons.kitchen_rounded, 'Cocina', '/kitchen'),
          const SizedBox(height: 8),
          _buildNavItem(context, Icons.receipt_long_rounded, 'Pedidos', '/orders'),
          const SizedBox(height: 8),
          _buildNavItem(context, Icons.analytics_outlined, 'Reportes', '/reports'),
          const Spacer(),
          _buildNavItem(context, Icons.logout_rounded, 'Salir', '/login', isLogout: true),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, IconData icon, String label, String route, {bool isLogout = false}) {
    final bool isActive = activeRoute == route;

    return InkWell(
      onTap: () => isLogout ? null : context.go(route),
      child: Container(
        width: 64,
        height: 64,
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isActive ? [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isActive ? Colors.white : Colors.grey.shade400,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey.shade500,
                fontSize: 9,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
