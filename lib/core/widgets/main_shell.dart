import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import 'side_nav_bar.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final GoRouterState state = GoRouterState.of(context);
    final String activeRoute = state.uri.path;

    return Scaffold(
      body: Row(
        children: [
          // Persist Sidebar
          SideNavBar(activeRoute: activeRoute),
          
          // Main Area
          Expanded(
            child: Column(
              children: [
                // Top Navigation Bar
                _buildTopBar(context),
                
                // Actual Content
                Expanded(
                  child: Container(
                    color: const Color(0xFFF7F9FF), // Surface-Dim from mockup
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
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEDF4FF))),
      ),
      child: Row(
        children: [
          const Text(
            'El Brasero',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.primaryColor,
              letterSpacing: -1,
            ),
          ),
          const Spacer(),
          // Search Bar (Visual only for now)
          Container(
            width: 300,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFEDF4FF),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Row(
              children: [
                Icon(Icons.search, color: Colors.grey, size: 18),
                SizedBox(width: 8),
                Text('Buscar pedido...', style: TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(width: 32),
          // User Profile
          Row(
            children: [
              const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Hola, Admin 👋', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('Administrador', style: TextStyle(color: Colors.grey, fontSize: 10)),
                ],
              ),
              const SizedBox(width: 12),
              CircleAvatar(
                radius: 20,
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                child: const Icon(Icons.person, color: AppTheme.primaryColor),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
