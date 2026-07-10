import 'package:flutter/foundation.dart';
import '../../features/kitchen/models/order_model.dart';

class PrintService {
  static Future<void> printTicket({
    required int mesaNumero,
    required List<OrderItem> items,
    required double subtotal,
    required double igv,
    required double total,
    String? ruc,
  }) async {
    final String receiptText = _generateTextReceipt(
      mesaNumero: mesaNumero,
      items: items,
      subtotal: subtotal,
      igv: igv,
      total: total,
      ruc: ruc,
    );

    if (kIsWeb) {
      debugPrint('--- SIMULACIÓN DE IMPRESIÓN ---');
      debugPrint(receiptText);
      debugPrint('--- FIN DE TICKET ---');
      // En una implementación real web se podría usar window.print() con un iframe
    } else {
      // Implementación Bluetooth para Mobile usando blue_thermal_printer o esc_pos
      debugPrint('Imprimiendo en dispositivo físico...');
    }
  }

  static String _generateTextReceipt({
    required int mesaNumero,
    required List<OrderItem> items,
    required double subtotal,
    required double igv,
    required double total,
    String? ruc,
  }) {
    final buffer = StringBuffer();
    buffer.writeln('          MR. PEPE             ');
    buffer.writeln('    ROCIO ELENA DE LA CRUZ BALDEON ');
    buffer.writeln('      RUC: 10418236103         ');
    buffer.writeln('      CEL: 984335339           ');
    buffer.writeln('      AV. PRINCIPAL 123        ');
    buffer.writeln('-------------------------------');
    buffer.writeln('FECHA: ${DateTime.now().toLocal()}');
    buffer.writeln('MESA: $mesaNumero');
    if (ruc != null) buffer.writeln('DOCUMENTO: $ruc');
    buffer.writeln('-------------------------------');
    buffer.writeln('DESCRIPCIÓN      CANT      PRECIO');
    for (var item in items) {
      final name = item.nombre.padRight(15).substring(0, 15);
      final qty = item.cantidad.toString().padRight(4);
      final price = (item.precio * item.cantidad).toStringAsFixed(2);
      buffer.writeln('$name $qty $price');
    }
    buffer.writeln('-------------------------------');
    buffer.writeln('OP. GRAVADA:      S/ ${subtotal.toStringAsFixed(2)}');
    buffer.writeln('IGV (10%):        S/ ${igv.toStringAsFixed(2)}');
    buffer.writeln('TOTAL:            S/ ${total.toStringAsFixed(2)}');
    buffer.writeln('-------------------------------');
    buffer.writeln('      ¡GRACIAS POR SU COMPRA!  ');
    return buffer.toString();
  }
}
