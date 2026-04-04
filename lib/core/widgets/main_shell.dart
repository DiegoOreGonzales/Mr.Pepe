import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import 'side_nav_bar.dart';
import 'brasa_logo.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final GoRouterState state = GoRouterState.of(context);
    final String activeRoute = state.uri.path;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Row(
        children: [
          // Sidebar (Full Height)
          SideNavBar(activeRoute: activeRoute),
          
          // Main Body (Header + Content)
          Expanded(
            child: Column(
              children: [
                _buildTopBar(context),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7F9FF),
                      // No explicit border to unify with Header
                    ),
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

  Widget _buildTopBar(BuildContext context) {
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isSmallScreen = screenWidth < 950;
    final bool hideGreeting = screenWidth < 850;

    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: Row(
        children: [
          // Logo Area - Fixed width
          const BrasaLogo(size: 30),
          
          if (!hideGreeting) ...[
            const SizedBox(width: 24),
            const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('¡Hola Admin!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFFC06C34))),
                Text('Bienvenido de nuevo', style: TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ],
          
          const Spacer(flex: 1),
          
          // Search - Flexible to prevent overflow
          Flexible(
            flex: 4,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: TextField(
                decoration: InputDecoration(
                  hintText: isSmallScreen ? 'Buscar...' : 'Buscar por mesa, producto...',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                  filled: true,
                  fillColor: const Color(0xFFF4F7FE),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(40), borderSide: BorderSide.none),
                ),
              ),
            ),
          ),
          
          const Spacer(flex: 1),
          
          // User Avatar & Actions
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('No tienes notificaciones nuevas'), duration: Duration(seconds: 2)),
                  );
                },
                icon: Stack(
                  children: [
                    const Icon(Icons.notifications_none_rounded, color: Colors.black87, size: 26),
                    Positioned(right: 2, top: 2, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              if (!isSmallScreen) ...[
                const Text('Admin', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(width: 8),
              ],
              GestureDetector(
                onTap: () {
                  showMenu(
                    context: context,
                    position: const RelativeRect.fromLTRB(1000, 80, 24, 0),
                    items: <PopupMenuEntry<String>>[
                      const PopupMenuItem<String>(
                        value: 'profile',
                        child: Row(
                          children: [
                            Icon(Icons.person_outline, size: 20),
                            SizedBox(width: 12),
                            Text('Ver Perfil', style: TextStyle(fontSize: 13)),
                          ],
                        ),
                      ),
                      const PopupMenuItem<String>(
                        value: 'settings',
                        child: Row(
                          children: [
                            Icon(Icons.settings_outlined, size: 20),
                            SizedBox(width: 12),
                            Text('Configuración', style: TextStyle(fontSize: 13)),
                          ],
                        ),
                      ),
                      const PopupMenuDivider(),
                      const PopupMenuItem<String>(
                        value: 'logout',
                        child: Row(
                          children: [
                            Icon(Icons.logout, color: Colors.red, size: 20),
                            SizedBox(width: 12),
                            Text('Cerrar Sesión', style: TextStyle(color: Colors.red, fontSize: 13)),
                          ],
                        ),
                      ),
                    ],
                  ).then((value) {
                    if (value == 'logout') context.go('/login');
                  });
                },
                child: CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFFF7F2EB),
                  child: const Icon(Icons.person_rounded, color: AppTheme.primaryColor, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(String title, String body) {
    return ListTile(
      leading: const CircleAvatar(backgroundColor: AppTheme.primaryColor, child: Icon(Icons.restaurant, color: Colors.white, size: 16)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      subtitle: Text(body, style: const TextStyle(fontSize: 12)),
      trailing: const Text('Ahora', style: TextStyle(fontSize: 10, color: Colors.grey)),
    );
  }
}
