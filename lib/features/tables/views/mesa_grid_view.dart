import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/table_provider.dart';
import 'mesa_card.dart';
import '../../orders/views/toma_pedido_view.dart';
import '../models/mesa_model.dart';

class MesaGridView extends ConsumerWidget {
  const MesaGridView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tables = ref.watch(tableProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'El Brasero',
          style: AppTheme.lightTheme.textTheme.headlineMedium?.copyWith(
            color: AppTheme.primaryColor,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none),
          ),
          Container(
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const IconButton(
              onPressed: null,
              icon: Icon(Icons.person, color: AppTheme.primaryColor),
            ),
          ),
        ],
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Mesas - ${tables.length} mesas',
                            style: AppTheme.lightTheme.textTheme.headlineMedium?.copyWith(
                              fontSize: 28,
                            ),
                          ),
                          Text(
                            'Visualización en tiempo real del salón principal',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.qr_code, size: 20),
                        label: const Text('IMPRIMIR QR'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Filtros (Mockup)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterButton('TODAS', isSelected: true),
                        _buildFilterButton('LIBRES'),
                        _buildFilterButton('OCUPADAS'),
                        _buildFilterButton('RESERVADAS'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 250,
                mainAxisSpacing: 20,
                crossAxisSpacing: 20,
                childAspectRatio: 1.4,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final mesa = tables[index];
                  return MesaCard(
                    mesa: mesa,
                    onTap: () {
                      if (mesa.status == MesaStatus.ocupada) {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: Text('Mesa #${mesa.numero}'),
                            content: const Text('¿Qué desea realizar?'),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => TomaPedidoView(mesa: mesa),
                                    ),
                                  );
                                },
                                child: const Text('VER / AGREGAR PEDIDO'),
                              ),
                              ElevatedButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  context.push('/billing', extra: mesa);
                                },
                                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                                child: const Text('COBRAR CUENTA'),
                              ),
                            ],
                          ),
                        );
                      } else {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => TomaPedidoView(mesa: mesa),
                          ),
                        );
                      }
                    },
                  );
                },
                childCount: tables.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildFilterButton(String label, {bool isSelected = false}) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey.shade200,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey.shade600,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
