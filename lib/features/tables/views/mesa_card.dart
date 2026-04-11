import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../models/mesa_model.dart';

class MesaCard extends StatefulWidget {
  final Mesa mesa;
  final VoidCallback onTap;

  const MesaCard({
    super.key,
    required this.mesa,
    required this.onTap,
  });

  @override
  State<MesaCard> createState() => _MesaCardState();
}

class _MesaCardState extends State<MesaCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final Color borderColor;
    final String statusText;
    final Color statusColor;
    final IconData statusIcon;

    switch (widget.mesa.status) {
      case MesaStatus.libre:
        borderColor = const Color(0xFF1A8952);
        statusText  = 'LIBRE';
        statusColor = const Color(0xFF1A8952);
        statusIcon  = Icons.check_circle_outline_rounded;
        break;
      case MesaStatus.ocupada:
        borderColor = AppTheme.primaryColor;
        statusText  = 'OCUPADA';
        statusColor = AppTheme.primaryColor;
        statusIcon  = Icons.people_rounded;
        break;
      case MesaStatus.reservada:
        borderColor = const Color(0xFF1A6FBF);
        statusText  = 'RESERVADA';
        statusColor = const Color(0xFF1A6FBF);
        statusIcon  = Icons.event_rounded;
        break;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit:  (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.all(16),
          transform: _hovered
              ? (Matrix4.identity()..translate(0.0, -3.0))
              : Matrix4.identity(),
          decoration: BoxDecoration(
            color: _hovered
                ? statusColor.withOpacity(0.04)
                : AppTheme.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _hovered ? statusColor.withOpacity(0.5) : AppTheme.borderGray,
              width: _hovered ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(_hovered ? 0.08 : 0.03),
                blurRadius: _hovered ? 16 : 6,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Número y badge de estado ───────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.mesa.numero.toString().padLeft(2, '0'),
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.black,
                      height: 1,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: statusColor.withOpacity(0.2), width: 1),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: statusColor,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),

              const Spacer(),

              // ── Info de la mesa ────────────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (widget.mesa.status == MesaStatus.ocupada &&
                          widget.mesa.encargado != null) ...[
                        Row(
                          children: [
                            Icon(Icons.person_rounded,
                                size: 11, color: statusColor),
                            const SizedBox(width: 3),
                            Text(
                              widget.mesa.encargado!,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 10,
                                color: statusColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                      ],
                      if (widget.mesa.status == MesaStatus.ocupada &&
                          widget.mesa.tiempoOcupada != null)
                        Text(
                          '${widget.mesa.tiempoOcupada!.inMinutes} min',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 10,
                            color: AppTheme.textMuted,
                          ),
                        ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(statusIcon,
                          size: 18,
                          color: statusColor.withOpacity(0.5)),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.mesa.capacidad}p',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 10,
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
