import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/tables/models/mesa_model.dart';
import '../../features/orders/providers/order_provider.dart';
import '../theme/app_theme.dart';

class CategoryIcon extends ConsumerWidget {
  final String categoryId;
  final double size;

  const CategoryIcon({super.key, required this.categoryId, this.size = 80});

  static IconData parseIcon(String iconName) {
    switch (iconName) {
      case 'local_fire_department': return Icons.local_fire_department_rounded;
      case 'lunch_dining':          return Icons.lunch_dining_rounded;
      case 'restaurant':            return Icons.restaurant_rounded;
      case 'local_cafe':            return Icons.local_cafe_rounded;
      case 'cake':                  return Icons.cake_rounded;
      case 'dinner_dining':         return Icons.dinner_dining_rounded;
      case 'inventory_2':           return Icons.inventory_2_rounded;
      case 'eco':                   return Icons.eco_rounded;
      default:                      return Icons.fastfood_rounded;
    }
  }

  static Color parseColor(String hex) {
    try {
      final buffer = StringBuffer();
      if (hex.length == 6 || hex.length == 7) buffer.write('ff');
      buffer.write(hex.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (e) {
      return Colors.grey;
    }
  }

  static List<Color> colorsFor(CategoryModel? cat) {
    if (cat == null || cat.colors.isEmpty) {
      return [const Color(0xFF616161), const Color(0xFF9E9E9E)];
    }
    return cat.colors.map((c) => parseColor(c)).toList();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoryProvider);
    final cat = categories.where((c) => c.id == categoryId.toLowerCase()).firstOrNull;

    final colors = colorsFor(cat);
    final iconData = parseIcon(cat?.icon ?? '');

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
        boxShadow: [
          BoxShadow(
            color: colors[0].withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          iconData,
          color: Colors.white,
          size: size * 0.45,
        ),
      ),
    );
  }
}
