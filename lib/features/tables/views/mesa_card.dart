import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../models/mesa_model.dart';

class MesaCard extends StatelessWidget {
  final Mesa mesa;
  final VoidCallback onTap;

  const MesaCard({
    super.key,
    required this.mesa,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderColor;
    String statusText;
    Color statusColor;
    Widget? infoWidget;

    switch (mesa.status) {
      case MesaStatus.libre:
        borderColor = AppTheme.successColor;
        statusText = 'LIBRE';
        statusColor = AppTheme.successColor;
        infoWidget = Icon(Icons.chair, color: statusColor.withOpacity(0.4), size: 40);
        break;
      case MesaStatus.ocupada:
        borderColor = AppTheme.occupiedColor;
        statusText = 'OCUPADA';
        statusColor = AppTheme.occupiedColor;
        infoWidget = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.person, color: statusColor, size: 14),
                const SizedBox(width: 4),
                Text(
                  mesa.encargado ?? 'Mesa 1',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            if (mesa.tiempoOcupada != null)
              Text(
                '${mesa.tiempoOcupada!.inMinutes} min',
                style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.bold),
              ),
          ],
        );
        break;
      case MesaStatus.reservada:
        borderColor = AppTheme.reservedColor;
        statusText = 'RESERVADA';
        statusColor = AppTheme.reservedColor;
        infoWidget = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'RESERVADO',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            ),
            Icon(Icons.event, color: statusColor.withOpacity(0.4), size: 20),
          ],
        );
        break;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border(
            left: BorderSide(color: borderColor, width: 4),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  mesa.numero.toString().padLeft(2, '0'),
                  style: AppTheme.lightTheme.textTheme.headlineMedium?.copyWith(
                    fontSize: 24,
                    height: 1,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                infoWidget,
                Text(
                  'Cap: ${mesa.capacidad}',
                  style: const TextStyle(fontSize: 10, color: AppTheme.outlineColor),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
