import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BrasaLogo extends StatefulWidget {
  final double size;
  final bool showText;
  final bool darkBackground;

  const BrasaLogo({
    super.key,
    this.size = 40,
    this.showText = true,
    this.darkBackground = false,
  });

  @override
  State<BrasaLogo> createState() => _BrasaLogoState();
}

class _BrasaLogoState extends State<BrasaLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _glowAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
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
                borderRadius: BorderRadius.circular(widget.size * 0.25),
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor
                        .withOpacity(0.35 * _glowAnimation.value),
                    blurRadius: 10 * _glowAnimation.value,
                    spreadRadius: 1 * _glowAnimation.value,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(widget.size * 0.25),
                child: Image.asset(
                  'assets/images/mr_pepe_logo-removebg-preview.png',
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Center(
                    child: Icon(
                      Icons.local_fire_department_rounded,
                      color: AppTheme.primaryColor,
                      size: widget.size * 0.58,
                    ),
                  ),
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
                "Mr Pepe",
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: widget.size * 0.43,
                  fontWeight: FontWeight.w800,
                  color: widget.darkBackground
                      ? AppTheme.white
                      : AppTheme.black,
                  letterSpacing: -0.3,
                  height: 1,
                ),
              ),
              Text(
                'ROASTER & GRILL',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: widget.size * 0.20,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
