import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BrasaLogo extends StatefulWidget {
  final double size;
  final bool showText;
  
  const BrasaLogo({
    super.key, 
    this.size = 40,
    this.showText = true,
  });

  @override
  State<BrasaLogo> createState() => _BrasaLogoState();
}

class _BrasaLogoState extends State<BrasaLogo> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _glowAnimation = Tween<double>(begin: 0.2, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _glowAnimation,
          builder: (context, child) {
            return Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.primaryColor,
                    AppTheme.primaryColor.withOpacity(0.4),
                    Colors.transparent,
                  ],
                  stops: [0.3, _glowAnimation.value, 1.0],
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withOpacity(0.4 * _glowAnimation.value),
                    blurRadius: 15 * _glowAnimation.value,
                    spreadRadius: 2 * _glowAnimation.value,
                  ),
                ],
              ),
              child: Center(
                child: Icon(
                  Icons.local_fire_department_rounded,
                  color: Colors.white,
                  size: widget.size * 0.6,
                ),
              ),
            );
          },
        ),
        if (widget.showText) ...[
          const SizedBox(width: 12),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'EL BRASERO',
                style: TextStyle(
                  fontSize: widget.size * 0.45,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.onBackgroundColor,
                  letterSpacing: -0.5,
                  height: 1,
                ),
              ),
              Text(
                'POLLERÍA & PARRILLAS',
                style: TextStyle(
                  fontSize: widget.size * 0.22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
