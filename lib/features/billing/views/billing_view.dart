import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../kitchen/models/order_model.dart';
import '../../tables/models/mesa_model.dart';
import '../../tables/providers/table_provider.dart';
import '../../orders/providers/order_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/widgets/brasa_logo.dart';

import '../../../core/services/sunat_service.dart';
import '../../../core/services/api_service.dart';

class BillingView extends ConsumerStatefulWidget {
  final Mesa mesa;
  const BillingView({super.key, required this.mesa});

  @override
  ConsumerState<BillingView> createState() => _BillingViewState();
}

class _BillingViewState extends ConsumerState<BillingView> {
  String _paymentMethod = 'Efectivo';
  bool _isFactura = false;
  final _rucController = TextEditingController();
  final _dniController = TextEditingController();
  
  String? _razonSocial;
  String? _direccion;
  String? _clienteNombre; // Para Boleta con DNI
  bool _isLoadingRUC = false;
  bool _isLoadingDNI = false;

  void _consultarDNI() async {
    final dni = _dniController.text.trim();
    if (dni.length != 8) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El DNI debe tener 8 dígitos')));
      return;
    }

    setState(() => _isLoadingDNI = true);
    final result = await SunatService.consultarDni(dni);
    setState(() {
      _isLoadingDNI = false;
      if (result != null) {
        _clienteNombre = result['nombres'];
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('DNI no encontrado')));
      }
    });
  }

  void _consultarRUC() async {
    final ruc = _rucController.text.trim();
    if (ruc.length != 11) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El RUC debe tener 11 dígitos')));
      return;
    }

    setState(() => _isLoadingRUC = true);
    final result = await SunatService.consultarRuc(ruc);
    setState(() {
      _isLoadingRUC = false;
      if (result != null) {
        _razonSocial = result.razonSocial;
        _direccion = result.direccion;
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('RUC no encontrado')));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FF),
      appBar: AppBar(
        title: Text('Cerrar Cuenta - Mesa #${widget.mesa.numero}'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: StreamBuilder<List<OrderModel>>(
        stream: Stream.periodic(const Duration(seconds: 3))
            .asyncMap((_) => ref.read(apiServiceProvider).fetchUnpaidOrdersByTable(widget.mesa.numero)),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 64),
                    const SizedBox(height: 16),
                    const Text('Error de Conexión o Índice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    Text(
                      'Es probable que falte un índice en Firestore para esta consulta específica. Revisa tu consola de Firebase o el enlace en la terminal para crearlo.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 24),
                    Text('Detalle: ${snapshot.error}', style: const TextStyle(fontSize: 10, color: Colors.red)),
                  ],
                ),
              ),
            );
          }
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final orders = snapshot.data!;
          if (orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.receipt_long_outlined, color: Colors.grey, size: 64),
                  const SizedBox(height: 16),
                  Text('La Mesa #${widget.mesa.numero} no tiene pedidos pendientes', 
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text('Si acabas de crear el índice en Firebase, espera 1 minuto.', 
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton.icon(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('VOLVER'),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton.icon(
                        onPressed: () => setState(() {}),
                        icon: const Icon(Icons.refresh),
                        label: const Text('REINTENTAR'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }
          final allItems = orders.expand((o) => o.items).toList();
          final double subtotal = allItems.fold(0, (sum, item) => sum + (item.precio * item.cantidad));
          final double igv = subtotal * 0.18;
          final double total = subtotal + igv;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column: Summary
                Expanded(
                  flex: 3,
                  child: _buildSummarySection(allItems, subtotal, igv, total),
                ),
                const SizedBox(width: 32),
                // Right Column: Payment & Invoice
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      _buildPaymentMethodSection(),
                      const SizedBox(height: 24),
                      _buildInvoiceSection(),
                      const SizedBox(height: 32),
                      _buildActionButtons(total, orders),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummarySection(List<OrderItem> items, double subtotal, double igv, double total) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Resumen de Consumo', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          ...items.map((item) {
            final allProducts = ref.read(productProvider);
            final product = allProducts.firstWhere((p) => p.id == item.productId, 
              orElse: () => Producto(id: '', nombre: '', descripcion: '', precio: 0, imagen: '', categoria: Categoria.parrillas));

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      image: product.imagen.isNotEmpty 
                        ? DecorationImage(image: NetworkImage(product.imagen), fit: BoxFit.cover)
                        : null,
                      color: Colors.grey.shade100,
                    ),
                    child: product.imagen.isEmpty ? const Icon(Icons.fastfood, size: 20, color: Colors.grey) : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.nombre, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('S/ ${item.precio.toStringAsFixed(2)} x ${item.cantidad}', 
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                      ],
                    ),
                  ),
                  Text(
                    'S/ ${(item.precio * item.cantidad).toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ],
              ),
            );
          }),
          const Divider(height: 48),
          _buildAmountRow('Subtotal', subtotal),
          const SizedBox(height: 8),
          _buildAmountRow('IGV (18%)', igv),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total a Pagar', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text('S/ ${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAmountRow(String label, double amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text('S/ ${amount.toStringAsFixed(2)}'),
      ],
    );
  }

  Widget _buildPaymentMethodSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Método de Pago', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 20),
          _buildPaymentOption('Efectivo', Icons.payments_outlined),
          _buildPaymentOption('Tarjeta', Icons.credit_card_outlined),
          _buildPaymentOption('Yape', null, isYape: true),
          _buildPaymentOption('Plin', null, isPlin: true),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(String label, IconData? icon, {bool isYape = false, bool isPlin = false}) {
    final bool isSelected = _paymentMethod == label;
    Color brandColor = AppTheme.primaryColor;
    if (isYape) brandColor = const Color(0xFF742384);
    if (isPlin) brandColor = const Color(0xFF00C8FF);

    return InkWell(
      onTap: () => setState(() => _paymentMethod = label),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: isSelected ? brandColor : Colors.grey.shade100, width: 2),
          borderRadius: BorderRadius.circular(16),
          color: isSelected ? brandColor.withOpacity(0.05) : Colors.white,
          boxShadow: isSelected ? [BoxShadow(color: brandColor.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 4))] : null,
        ),
        child: Row(
          children: [
            if (isYape) 
              Container(
                width: 36, 
                height: 36, 
                decoration: BoxDecoration(color: const Color(0xFF742384), borderRadius: BorderRadius.circular(8)), 
                child: const Center(child: Text('Y', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)))
              ),
            if (isPlin)
              Container(
                width: 36, 
                height: 36, 
                decoration: BoxDecoration(color: const Color(0xFF00C8FF), borderRadius: BorderRadius.circular(8)), 
                child: const Center(child: Text('P', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)))
              ),
            if (icon != null)
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: isSelected ? AppTheme.primaryColor : Colors.grey, size: 20),
              ),
            const SizedBox(width: 16),
            Text(label, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, fontSize: 16, color: isSelected ? brandColor : Colors.black87)),
            const Spacer(),
            if (isSelected) Icon(Icons.check_circle, color: brandColor, size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tipo de Comprobante', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildTypeToggle('BOLETA', !_isFactura)),
              const SizedBox(width: 8),
              Expanded(child: _buildTypeToggle('FACTURA', _isFactura)),
            ],
          ),
          const SizedBox(height: 24),
          if (!_isFactura) ...[
            const Text('Datos del Cliente (Opcional)', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _dniController,
                    keyboardType: TextInputType.number,
                    maxLength: 8,
                    decoration: InputDecoration(
                      hintText: 'DNI (Opcional)',
                      counterText: '',
                      filled: true,
                      fillColor: const Color(0xFFF7F9FF),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isLoadingDNI ? null : _consultarDNI,
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                  child: _isLoadingDNI 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                    : const Icon(Icons.person_search_outlined),
                ),
              ],
            ),
            if (_clienteNombre != null) ...[
              const SizedBox(height: 12),
              _buildInfoBox('Cliente', _clienteNombre!),
            ],
          ] else if (_isFactura) ...[
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _rucController,
                    keyboardType: TextInputType.number,
                    maxLength: 11,
                    decoration: InputDecoration(
                      hintText: 'Ingrese RUC',
                      counterText: '',
                      filled: true,
                      fillColor: const Color(0xFFF7F9FF),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isLoadingRUC ? null : _consultarRUC,
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                  child: _isLoadingRUC 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                    : const Icon(Icons.search),
                ),
              ],
            ),
            if (_razonSocial != null) ...[
              const SizedBox(height: 16),
              _buildInfoBox('Razón Social', _razonSocial!),
              const SizedBox(height: 8),
              _buildInfoBox('Dirección', _direccion!),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildInfoBox(String label, String value) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.primaryColor.withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTypeToggle(String label, bool active) {
    return InkWell(
      onTap: () => setState(() => _isFactura = label == 'FACTURA'),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? AppTheme.primaryColor : Colors.white,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Center(child: Text(label, style: TextStyle(color: active ? Colors.white : Colors.grey, fontWeight: FontWeight.bold))),
      ),
    );
  }

  Widget _buildActionButtons(double total, List<OrderModel> orders) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 56,
          child: Container(
            decoration: BoxDecoration(
              gradient: AppTheme.emberGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: ElevatedButton(
              onPressed: () => _processCheckout(orders, total),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
              ),
              child: Text(_isFactura ? 'EMITIR FACTURA F001' : 'EMITIR BOLETA B001', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            ),
          ),
        ),
      ],
    );
  }

  void _processCheckout(List<OrderModel> orders, double total) async {
    // 1. Recopilar datos del cliente
    final String cliente = _isFactura 
      ? (_razonSocial ?? 'RUC: ${_rucController.text}') 
      : (_clienteNombre ?? 'CONSUMIDOR FINAL');
    final String docId = _isFactura ? _rucController.text : _dniController.text;
    final String tipoDoc = _isFactura ? 'factura' : 'boleta';

    // 2. Marcar órdenes como pagadas guardando los datos del cliente y el N° de boleta
    final String correlativo = (DateTime.now().millisecondsSinceEpoch % 1000000).toString().padLeft(6, '0');
    final String voucherNumber = "${_isFactura ? 'F' : 'B'}001-$correlativo";

    final apiService = ref.read(apiServiceProvider);
    for (var order in orders) {
      await apiService.checkoutOrder(
        orderId: order.id,
        clienteNombre: cliente,
        clienteDocumento: docId.isEmpty ? null : docId,
        tipoDocumento: tipoDoc,
        voucherNumber: voucherNumber,
      );
    }
    
    // 2. Liberar Mesa
    await ref.read(tableProvider.notifier).updateTableStatus(widget.mesa.id, MesaStatus.libre, encargado: null);
    
    if (mounted) {
      _showReceiptDialog(orders, total, voucherNumber); // Pasamos el número generado
    }
  }

  void _showReceiptDialog(List<OrderModel> orders, double total, String voucherNumber) {
    final allItems = orders.expand((o) => o.items).toList();
    final String tipoDoc = _isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA';
    final String cliente = _isFactura 
      ? (_razonSocial ?? 'RUC: ${_rucController.text}') 
      : (_clienteNombre ?? 'CONSUMIDOR FINAL');
    final String docId = _isFactura ? _rucController.text : (_dniController.text.isEmpty ? '-' : _dniController.text);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        contentPadding: EdgeInsets.zero,
        backgroundColor: Colors.transparent,
        content: Container(
          width: 400,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4)),
          child: SingleChildScrollView(
            child: Column(
              children: [
                BrasaLogo(size: 40),
                const SizedBox(height: 8),
                const Text('RUC: 10418236103', style: TextStyle(fontSize: 12)),
                const Text('JR. JUNIN 413 - EL TAMBO - HUANCAYO', style: TextStyle(fontSize: 10)),
                const Divider(height: 32),
                Text(tipoDoc, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(voucherNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 16),
                
                // Client Info Section
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(_isFactura ? 'RUC: ' : 'DNI: ', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        Text(docId, style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CLIENTE: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        Expanded(child: Text(cliente, style: const TextStyle(fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('CANT  DESCRIPCIÓN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    Text('TOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
                const Divider(),
                ...allItems.map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${item.cantidad} x ${item.nombre}', style: const TextStyle(fontSize: 11)),
                      Text('S/ ${(item.precio * item.cantidad).toStringAsFixed(2)}', style: const TextStyle(fontSize: 11)),
                    ],
                  ),
                )),
                const Divider(),
                _buildReceiptRow('OP. GRAVADA', 'S/ ${(total / 1.18).toStringAsFixed(2)}'),
                _buildReceiptRow('IGV (18%)', 'S/ ${(total - (total / 1.18)).toStringAsFixed(2)}'),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('TOTAL A PAGAR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('S/ ${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Imprimiendo en impresora térmica...')));
                      Navigator.pop(context); // Cerrar diálogo
                      context.go('/dashboard'); // Ir a Home
                    },
                    icon: const Icon(Icons.print),
                    label: Text(_isFactura ? 'IMPRIMIR FACTURA' : 'IMPRIMIR BOLETA'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context); // Cerrar diálogo
                    context.go('/dashboard'); // Ir a Home
                  },
                  child: const Text('CERRAR SIN IMPRIMIR', style: TextStyle(color: Colors.grey, fontSize: 10)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 10)),
        Text(value, style: const TextStyle(fontSize: 10)),
      ],
    );
  }
}
