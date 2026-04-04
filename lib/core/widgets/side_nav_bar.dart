import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class SideNavBar extends StatelessWidget {
  final String activeRoute;
  const SideNavBar({super.key, required this.activeRoute});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        width: 100,
        height: MediaQuery.of(context).size.height,
        color: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          children: [
            // Brand Logo
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: AppTheme.emberGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.restaurant, color: Colors.white, size: 32),
            ),
            const SizedBox(height: 8),
            const Text('EB', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
            const SizedBox(height: 32),
            
            _buildNavItem(context, Icons.dashboard, 'Home', '/dashboard'),
            const SizedBox(height: 12),
            _buildNavItem(context, Icons.restaurant_menu, 'Mesas', '/mesas'),
            const SizedBox(height: 12),
            _buildNavItem(context, Icons.kitchen, 'Cocina', '/kitchen'),
            const SizedBox(height: 12),
            _buildNavItem(context, Icons.receipt_long, 'Pedidos', '/orders'),
            const SizedBox(height: 12),
            _buildNavItem(context, Icons.bar_chart, 'Reportes', '/reports'),
            const Spacer(),
            _buildNavItem(context, Icons.logout, 'Salir', '/login', isLogout: true),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, IconData icon, String label, String route, {bool isLogout = false}) {
    final bool isActive = activeRoute.startsWith(route);

    return InkWell(
      onTap: () {
        if (isLogout) {
          // Lógica de logout
          return;
        }
        context.go(route);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: isActive ? const Border(right: BorderSide(color: AppTheme.primaryColor, width: 4)) : null,
          color: isActive ? AppTheme.primaryColor.withOpacity(0.05) : null,
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isActive ? AppTheme.primaryColor : Colors.grey,
              size: 28,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isActive ? AppTheme.primaryColor : Colors.grey,
                fontSize: 10,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
