import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/category_icon.dart';
import '../../orders/providers/order_provider.dart';
import '../../tables/models/mesa_model.dart';

class ProductsView extends ConsumerStatefulWidget {
  const ProductsView({super.key});

  @override
  ConsumerState<ProductsView> createState() => _ProductsViewState();
}

class _ProductsViewState extends ConsumerState<ProductsView> {
  String _searchQuery = '';
  String? _selectedCategory;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allProducts = ref.watch(productProvider);
    final categories = ref.watch(categoryProvider);
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 750;

    // Filter
    final filtered = allProducts.where((p) {
      final matchesSearch = _searchQuery.isEmpty ||
          p.nombre.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.descripcion.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesCat = _selectedCategory == null || p.effectiveCategory == _selectedCategory;
      return matchesSearch && matchesCat;
    }).toList();

    // Count by category
    final catCounts = <String, int>{};
    for (final p in allProducts) {
      catCounts[p.effectiveCategory] = (catCounts[p.effectiveCategory] ?? 0) + 1;
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.borderGray),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Gestión de Carta & Inventario',
                        style: TextStyle(fontFamily: 'Inter', fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.black),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${allProducts.length} productos · Sincronizado con Firestore',
                        style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showProductModal(context, null),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: Text(isMobile ? 'Nuevo' : 'Nuevo Producto'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Search + Category Filters ────────────────────────────
          Wrap(
            spacing: 10,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              // Search
              SizedBox(
                width: isMobile ? double.infinity : 300,
                height: 40,
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val),
                  style: const TextStyle(fontFamily: 'Inter', fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Buscar producto...',
                    hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textMuted, size: 18),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppTheme.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.borderGray),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.borderGray),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
                    ),
                  ),
                ),
              ),
              // All filter
              _FilterChip(
                label: 'Todos (${allProducts.length})',
                isSelected: _selectedCategory == null,
                onTap: () => setState(() => _selectedCategory = null),
              ),
              // Category filters
              for (final cat in categories)
                if ((catCounts[cat.id] ?? 0) > 0)
                  _FilterChip(
                    label: '${cat.emoji} ${cat.label} (${catCounts[cat.id]})',
                    isSelected: _selectedCategory == cat.id,
                    onTap: () => setState(() => _selectedCategory = cat.id),
                    accentColors: CategoryIcon.colorsFor(cat),
                  ),
            ],
          ),
          const SizedBox(height: 20),

          // ── Products Grid ────────────────────────────────────────
          if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 60),
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTheme.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.borderGray),
              ),
              child: Column(
                children: [
                  Icon(Icons.fastfood_rounded, size: 48, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text('No se encontraron productos', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  const Text('Intenta cambiar el filtro o la búsqueda', style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: AppTheme.textMuted)),
                ],
              ),
            )
          else
            LayoutBuilder(
              builder: (context, constraints) {
                int crossAxisCount = 1;
                if (constraints.maxWidth > 1100) crossAxisCount = 4;
                else if (constraints.maxWidth > 800) crossAxisCount = 3;
                else if (constraints.maxWidth > 500) crossAxisCount = 2;

                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    return _ProductCard(
                      producto: p,
                      onEdit: () => _showProductModal(context, p),
                      onDelete: () => _deleteProduct(p),
                    );
                  },
                );
              },
            ),
        ],
      ),
    );
  }

  Future<void> _deleteProduct(Producto p) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar producto', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
        content: Text('¿Estás seguro de eliminar "${p.nombre}"?', style: const TextStyle(fontFamily: 'Inter', fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Eliminar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await FirebaseFirestore.instance.collection('products').doc(p.id).delete();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Producto "${p.nombre}" eliminado'), backgroundColor: Colors.red.shade700),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error al eliminar: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  void _showNewCategoryModal(BuildContext parentCtx, Function(String newId) onCreated) {
    final nameCtrl = TextEditingController();
    String selectedEmoji = '🔥';
    String selectedIcon = 'local_fire_department';
    List<String> selectedColors = ['#E53935', '#FF7043'];

    final emojis = [
      {'e': '🔥', 'i': 'local_fire_department', 'c': ['#E53935', '#FF7043']},
      {'e': '🍗', 'i': 'lunch_dining', 'c': ['#F9A825', '#FFCC02']},
      {'e': '🍖', 'i': 'restaurant', 'c': ['#E91E63', '#FF6090']},
      {'e': '🥤', 'i': 'local_cafe', 'c': ['#1E88E5', '#42A5F5']},
      {'e': '🍛', 'i': 'dinner_dining', 'c': ['#2E7D32', '#66BB6A']},
      {'e': '🎁', 'i': 'inventory_2', 'c': ['#E64A19', '#FF8A65']},
      {'e': '🍰', 'i': 'cake', 'c': ['#8E24AA', '#CE93D8']},
      {'e': '🥗', 'i': 'eco', 'c': ['#43A047', '#A5D6A7']},
    ];

    showDialog(
      context: parentCtx,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setInnerState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Nueva Categoría', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('NOMBRE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: nameCtrl,
                    style: const TextStyle(fontFamily: 'Inter', fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Ej. Pastas',
                      filled: true,
                      fillColor: AppTheme.lightGray,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderGray)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderGray)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text('SELECCIONA ICONO/ESTILO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: emojis.map((item) {
                      final isSel = selectedEmoji == item['e'];
                      final colors = (item['c'] as List<String>).map((h) => CategoryIcon.parseColor(h)).toList();

                      return GestureDetector(
                        onTap: () {
                          setInnerState(() {
                            selectedEmoji = item['e'] as String;
                            selectedIcon = item['i'] as String;
                            selectedColors = item['c'] as List<String>;
                          });
                        },
                        child: Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(colors: colors),
                            border: Border.all(color: isSel ? Colors.black : Colors.transparent, width: 2),
                            boxShadow: [
                              BoxShadow(color: colors[0].withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Center(
                            child: Text(item['e'] as String, style: const TextStyle(fontSize: 18)),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
                ElevatedButton(
                  onPressed: () async {
                    final label = nameCtrl.text.trim();
                    if (label.isEmpty) return;
                    final id = label.toLowerCase().replaceAll(' ', '_');

                    await FirebaseFirestore.instance.collection('categories').doc(id).set({
                      'label': label,
                      'emoji': selectedEmoji,
                      'icon': selectedIcon,
                      'colors': selectedColors,
                    });

                    if (ctx.mounted) Navigator.pop(ctx);
                    onCreated(id);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                  child: const Text('Crear', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showProductModal(BuildContext context, Producto? existing) {
    final isEditing = existing != null;
    final nameCtrl = TextEditingController(text: existing?.nombre ?? '');
    final descCtrl = TextEditingController(text: existing?.descripcion ?? '');
    final priceCtrl = TextEditingController(text: existing != null ? existing.precio.toString() : '');
    String selectedCatId = existing?.categoria ?? 'parrillas';
    bool isDestacado = existing?.isDestacado ?? false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final categories = ref.watch(categoryProvider);

            // Verify if selectedCatId exists in categories
            if (!categories.any((c) => c.id == selectedCatId) && categories.isNotEmpty) {
              selectedCatId = categories.first.id;
            }

            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Container(
                width: 420,
                padding: const EdgeInsets.all(24),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(isEditing ? Icons.edit_rounded : Icons.add_rounded, color: AppTheme.primaryColor, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            isEditing ? 'Editar Producto' : 'Nuevo Producto',
                            style: const TextStyle(fontFamily: 'Inter', fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.black),
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: () => Navigator.pop(ctx),
                            icon: const Icon(Icons.close_rounded, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Preview icon
                      Center(
                        child: CategoryIcon(categoryId: selectedCatId, size: 64),
                      ),
                      const SizedBox(height: 16),

                      // Nombre
                      _buildLabel('Nombre del Producto'),
                      const SizedBox(height: 6),
                      _buildTextField(nameCtrl, 'Ej. Pollo a la Brasa 1/4'),
                      const SizedBox(height: 14),

                      // Categoría
                      _buildLabel('Categoría'),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.borderGray),
                          color: AppTheme.lightGray,
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: selectedCatId,
                            isExpanded: true,
                            style: const TextStyle(fontFamily: 'Inter', fontSize: 13, color: AppTheme.black),
                            items: [
                              ...categories.map((cat) {
                                return DropdownMenuItem<String>(
                                  value: cat.id,
                                  child: Row(
                                    children: [
                                      Text(cat.emoji, style: const TextStyle(fontSize: 16)),
                                      const SizedBox(width: 8),
                                      Text(cat.label),
                                    ],
                                  ),
                                );
                              }),
                              const DropdownMenuItem<String>(
                                value: 'CREATE_NEW',
                                child: Row(
                                  children: [
                                    Icon(Icons.add_circle_outline, color: AppTheme.primaryColor, size: 18),
                                    SizedBox(width: 8),
                                    Text('＋ Nueva categoría...', style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                            onChanged: (val) {
                              if (val == 'CREATE_NEW') {
                                _showNewCategoryModal(ctx, (newId) {
                                  setModalState(() {
                                    selectedCatId = newId;
                                  });
                                });
                              } else if (val != null) {
                                setModalState(() => selectedCatId = val);
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Precio
                      _buildLabel('Precio (S/)'),
                      const SizedBox(height: 6),
                      _buildTextField(priceCtrl, '25.50', isNumber: true),
                      const SizedBox(height: 14),

                      // Descripción
                      _buildLabel('Descripción'),
                      const SizedBox(height: 6),
                      TextField(
                        controller: descCtrl,
                        maxLines: 3,
                        style: const TextStyle(fontFamily: 'Inter', fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Detalla ingredientes o acompañamientos...',
                          hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                          filled: true,
                          fillColor: AppTheme.lightGray,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderGray)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderGray)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5)),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Destacado
                      InkWell(
                        onTap: () => setModalState(() => isDestacado = !isDestacado),
                        borderRadius: BorderRadius.circular(8),
                        child: Row(
                          children: [
                            Checkbox(
                              value: isDestacado,
                              onChanged: (v) => setModalState(() => isDestacado = v ?? false),
                              activeColor: AppTheme.primaryColor,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                            ),
                            const Text('Destacar en la carta digital', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(ctx),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                side: const BorderSide(color: AppTheme.borderGray),
                              ),
                              child: const Text('Cancelar', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                if (nameCtrl.text.isEmpty || priceCtrl.text.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Nombre y Precio son obligatorios')),
                                  );
                                  return;
                                }
                                final data = {
                                  'nombre': nameCtrl.text.trim(),
                                  'descripcion': descCtrl.text.trim(),
                                  'precio': double.tryParse(priceCtrl.text) ?? 0,
                                  'categoria': selectedCatId.toLowerCase(),
                                  'imagen': '',
                                  'isDestacado': isDestacado,
                                  'updatedAt': FieldValue.serverTimestamp(),
                                };
                                try {
                                  if (isEditing) {
                                    await FirebaseFirestore.instance.collection('products').doc(existing.id).update(data);
                                  } else {
                                    data['createdAt'] = FieldValue.serverTimestamp();
                                    await FirebaseFirestore.instance.collection('products').add(data);
                                  }
                                  if (ctx.mounted) Navigator.pop(ctx);
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(isEditing ? 'Producto actualizado' : 'Producto creado'),
                                        backgroundColor: const Color(0xFF1A8952),
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                                    );
                                  }
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: Text(isEditing ? 'Guardar Cambios' : 'Agregar Producto', style: const TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(fontFamily: 'Inter', fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 1),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String hint, {bool isNumber = false}) {
    return TextField(
      controller: ctrl,
      keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
      style: const TextStyle(fontFamily: 'Inter', fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
        filled: true,
        fillColor: AppTheme.lightGray,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderGray)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderGray)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5)),
      ),
    );
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────
class _ProductCard extends StatelessWidget {
  final Producto producto;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _ProductCard({required this.producto, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final categories = ref.watch(categoryProvider);
        final cat = categories.where((c) => c.id == producto.effectiveCategory).firstOrNull;
        final colors = CategoryIcon.colorsFor(cat);

        return Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderGray),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon header
              Container(
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [colors[0].withOpacity(0.15), colors[1].withOpacity(0.08)],
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Icon(
                        CategoryIcon.parseIcon(cat?.icon ?? ''),
                        size: 44,
                        color: colors[0].withOpacity(0.6),
                      ),
                    ),
                    // Category badge
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: colors[0].withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          cat?.emoji ?? '🍔',
                          style: const TextStyle(fontSize: 10),
                        ),
                      ),
                    ),
                    // Featured badge
                    if (producto.isDestacado)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('⭐ Destacado', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
                        ),
                      ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        producto.nombre,
                        style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.black),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Expanded(
                        child: Text(
                          producto.descripcion.isNotEmpty ? producto.descripcion : 'Sin descripción',
                          style: const TextStyle(fontFamily: 'Inter', fontSize: 11, color: AppTheme.textMuted),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Divider(height: 16),
                      Row(
                        children: [
                          Text(
                            'S/ ${producto.precio.toStringAsFixed(2)}',
                            style: const TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.primaryColor),
                          ),
                          const Spacer(),
                          InkWell(
                            onTap: onEdit,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderGray),
                              ),
                              child: const Icon(Icons.edit_rounded, size: 16, color: AppTheme.textMuted),
                            ),
                          ),
                          const SizedBox(width: 6),
                          InkWell(
                            onTap: onDelete,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.red.shade100),
                              ),
                              child: Icon(Icons.delete_rounded, size: 16, color: Colors.red.shade400),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final List<Color>? accentColors;
  const _FilterChip({required this.label, required this.isSelected, required this.onTap, this.accentColors});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (accentColors != null ? accentColors![0] : AppTheme.black)
              : AppTheme.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : AppTheme.borderGray,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppTheme.textMuted,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
