import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../kitchen/models/order_model.dart';
import '../../tables/models/mesa_model.dart';
import '../../tables/providers/table_provider.dart';

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
        stream: FirebaseFirestore.instance
            .collection('orders')
            .where('mesaNumero', isEqualTo: widget.mesa.numero)
            .where('status', isNotEqualTo: 'entregado')
            .snapshots()
            .map((s) => s.docs.map((d) => OrderModel.fromFirestore(d)).toList()),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final orders = snapshot.data!;
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
          ...items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  children: [
                    Text('${item.cantidad}x ', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Expanded(child: Text(item.nombre)),
                    Text('S/ ${(item.precio * item.cantidad).toStringAsFixed(2)}'),
                  ],
                ),
              )),
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
          const Text('Método de Pago', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildPaymentOption('Efectivo', Icons.payments),
          _buildPaymentOption('Tarjeta', Icons.credit_card),
          _buildPaymentOption('Yape', Icons.qr_code, color: Colors.purple),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(String label, IconData icon, {Color color = AppTheme.primaryColor}) {
    final bool isSelected = _paymentMethod == label;
    return InkWell(
      onTap: () => setState(() => _paymentMethod = label),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : null,
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? AppTheme.primaryColor : Colors.grey),
            const SizedBox(width: 12),
            Text(label, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
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
        children: [
          Row(
            children: [
              Expanded(child: _buildTypeToggle('BOLETA', !_isFactura)),
              Expanded(child: _buildTypeToggle('FACTURA', _isFactura)),
            ],
          ),
          if (_isFactura) ...[
            const SizedBox(height: 16),
            TextField(
              controller: _rucController,
              decoration: const InputDecoration(labelText: 'RUC / Razón Social', border: OutlineInputBorder()),
            ),
          ],
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
              onPressed: () => _processCheckout(orders),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
              ),
              child: const Text('EMITIR COMPROBANTE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            ),
          ),
        ),
      ],
    );
  }

  void _processCheckout(List<OrderModel> orders) async {
    // 1. Marcar órdenes como entregadas/finalizadas
    for (var order in orders) {
      await FirebaseFirestore.instance.collection('orders').doc(order.id).update({'status': 'entregado'});
    }
    
    // 2. Liberar Mesa
    await ref.read(tableProvider.notifier).updateTableStatus(widget.mesa.id, MesaStatus.libre, encargado: null);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pago procesado con éxito. Mesa liberada.')));
      context.go('/dashboard');
    }
  }
}
