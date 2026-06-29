import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/theme/app_theme.dart';
import 'package:universal_html/html.dart' as html;
import '../../../core/widgets/brasa_logo.dart';

class QrGridView extends StatelessWidget {
  const QrGridView({super.key});

  @override
  Widget build(BuildContext context) {
    // Generar datos para 40 mesas
    final List<int> mesas = List.generate(40, (i) => i + 1);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Códigos QR - Todas las Mesas'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          ElevatedButton.icon(
            onPressed: () {
              // Activar impresión nativa del navegador
              html.window.print();
            },
            icon: const Icon(Icons.print),
            label: const Text('IMPRIMIR PÁGINA'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(32),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 300,
          mainAxisSpacing: 32,
          crossAxisSpacing: 32,
          childAspectRatio: 0.85,
        ),
        itemCount: mesas.length,
        itemBuilder: (context, index) {
          final mesaNum = mesas[index];
          String host = 'localhost:3000';
          try {
            final locHost = html.window.location.host;
            if (locHost.isNotEmpty) {
              host = locHost;
            }
          } catch (_) {}
          final String qrData = 'http://$host/#/menu/$mesaNum';
          
          return _buildQrCard(context, mesaNum, qrData);
        },
      ),
    );
  }

  Widget _buildQrCard(BuildContext context, int mesaNum, String data) {
    return InkWell(
      onTap: () => _showQrFocus(context, mesaNum, data),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade200),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'MESA',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade400,
                letterSpacing: 2,
              ),
            ),
            Text(
              '$mesaNum',
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 16),
            QrImageView(
              data: data,
              version: QrVersions.auto,
              size: 160.0,
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: AppTheme.primaryColor,
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'ESCANEA PARA PEDIR',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.black54,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showQrFocus(BuildContext context, int mesaNum, String data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        titlePadding: EdgeInsets.zero,
        content: Container(
          width: 400,
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              BrasaLogo(size: 40),
              const SizedBox(height: 24),
              const Text('CARTA DIGITAL', style: TextStyle(letterSpacing: 3, fontSize: 12, color: Colors.grey)),
              Text('MESA $mesaNum', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
              const SizedBox(height: 32),
              QrImageView(
                data: data,
                version: QrVersions.auto,
                size: 250,
                eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppTheme.primaryColor),
              ),
              const SizedBox(height: 24),
              const Text('Escanea con tu celular', style: TextStyle(fontWeight: FontWeight.bold)),
              const Text('para ver nuestra carta y pedir', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enviando a impresión individual...')));
                  },
                  icon: const Icon(Icons.print),
                  label: const Text('IMPRIMIR QR SELECCIONADO'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white),
                ),
              ),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('CERRAR')),
            ],
          ),
        ),
      ),
    );
  }
}
