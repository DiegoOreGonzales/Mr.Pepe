enum MesaStatus { libre, ocupada, reservada }

class Mesa {
  final String id;
  final int numero;
  final int capacidad;
  final MesaStatus status;
  final String? encargado;
  final Duration? tiempoOcupada;

  Mesa({
    required this.id,
    required this.numero,
    required this.capacidad,
    this.status = MesaStatus.libre,
    this.encargado,
    this.tiempoOcupada,
  });

  factory Mesa.mock(int numero) {
    return Mesa(
      id: 'mesa_$numero',
      numero: numero,
      capacidad: 4,
    );
  }

  Mesa copyWith({
    MesaStatus? status,
    String? encargado,
    Duration? tiempoOcupada,
  }) {
    return Mesa(
      id: id,
      numero: numero,
      capacidad: capacidad,
      status: status ?? this.status,
      encargado: encargado ?? this.encargado,
      tiempoOcupada: tiempoOcupada ?? this.tiempoOcupada,
    );
  }
}

class CategoryModel {
  final String id;
  final String label;
  final String icon;
  final List<String> colors;
  final String emoji;

  CategoryModel({
    required this.id,
    required this.label,
    required this.icon,
    required this.colors,
    required this.emoji,
  });

  factory CategoryModel.fromMap(String id, Map<String, dynamic> map) {
    final colorsData = map['colors'] as List<dynamic>? ?? ['#424242', '#757575'];
    return CategoryModel(
      id: id,
      label: map['label'] ?? '',
      icon: map['icon'] ?? 'fastfood',
      colors: colorsData.map((e) => e.toString()).toList(),
      emoji: map['emoji'] ?? '🍔',
    );
  }
}

class Producto {
  final String id;
  final String nombre;
  final String descripcion;
  final double precio;
  final String imagen;
  final String categoria; // String id referencing CategoryModel
  final bool isDestacado;

  Producto({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.precio,
    required this.imagen,
    required this.categoria,
    this.isDestacado = false,
  });

  String get effectiveCategory {
    final nameLower = nombre.toLowerCase();
    
    if (nameLower.contains("brasa") || nameLower.contains("pollo a la brasa")) return "parrillas";
    if (nameLower.contains("broaster")) return "broaster";
    if (nameLower.contains("alitas") || nameLower.contains("piqueo") || nameLower.contains("tequeño")) return "piqueos";
    if (
      nameLower.contains("pepsi") || nameLower.contains("cola") || nameLower.contains("chicha") || 
      nameLower.contains("maracuya") || nameLower.contains("limonada") || nameLower.contains("agua") || 
      nameLower.contains("mate") || nameLower.contains("jugo") || nameLower.contains("bebida")
    ) {
      return "bebidas";
    }
    if (nameLower.contains("flan") || nameLower.contains("marquesa") || nameLower.contains("gelatina") || nameLower.contains("postre")) return "postres";
    if (nameLower.contains("ensalada")) return "ensaladas";
    if (nameLower.contains("combo")) return "combos";
    if (
      nameLower.contains("guarnicion") || nameLower.contains("porcion") || nameLower.contains("papas") || 
      nameLower.contains("arroz") || nameLower.contains("chaufa") || nameLower.contains("lomo") || 
      nameLower.contains("tallarin")
    ) {
      return "extras";
    }
    
    return categoria.toLowerCase();
  }
}
