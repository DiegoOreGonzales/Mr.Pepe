enum UserRole { admin, mesero, cocina }

class UserModel {
  final String uid;
  final String email;
  final String nombre;
  final UserRole role;

  UserModel({
    required this.uid,
    required this.email,
    required this.nombre,
    required this.role,
  });

  factory UserModel.fromMap(String uid, Map<String, dynamic> map) {
    return UserModel(
      uid: uid,
      email: map['email'] ?? '',
      nombre: map['nombre'] ?? '',
      role: _roleFromString(map['role']),
    );
  }

  static UserRole _roleFromString(String? role) {
    switch (role) {
      case 'admin': return UserRole.admin;
      case 'cocina': return UserRole.cocina;
      default: return UserRole.mesero;
    }
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'nombre': nombre,
      'role': role.name,
    };
  }
}
