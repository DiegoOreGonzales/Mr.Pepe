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

enum Categoria { parrillas, piqueos, bebidas, postres, ensaladas, broaster, extras, combos }

class Producto {
  final String id;
  final String nombre;
  final String descripcion;
  final double precio;
  final String imagen;
  final Categoria categoria;
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
}
