import 'package:dio/dio.dart';

class SunatResult {
  final String ruc;
  final String razonSocial;
  final String direccion;
  final String tipo;
  final String estado;
  final String condicion;

  SunatResult({
    required this.ruc, 
    required this.razonSocial, 
    required this.direccion,
    this.tipo = '',
    this.estado = 'ACTIVO',
    this.condicion = 'HABIDO',
  });

  factory SunatResult.fromJson(Map<String, dynamic> json) {
    return SunatResult(
      ruc: json['numero_documento'] ?? json['numeroDocumento'] ?? '',
      razonSocial: json['razon_social'] ?? json['nombre'] ?? '',
      direccion: json['direccion'] ?? 'SIN DIRECCIÓN REGISTRADA',
      tipo: json['tipo'] ?? '',
      estado: json['estado'] ?? 'ACTIVO',
      condicion: json['condicion'] ?? 'HABIDO',
    );
  }
}

class SunatService {
  // Token oficial de Decolecta.com
  static const String _apiToken = 'sk_14454.M1eWu2jme3QbQmdtgKDNlmOatH8kmbBy'; 
  static final Dio _dio = Dio();

  static Future<SunatResult?> consultarRuc(String ruc) async {
    // Para que funcione en localhost, recuerda activar el acceso en:
    // https://cors-anywhere.herokuapp.com/corsdemo
    
    final String proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    final String targetUrl = 'https://api.decolecta.com/v1/sunat/ruc?numero=$ruc';
    
    try {
      final response = await _dio.get(
        '$proxyUrl$targetUrl',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiToken',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      if (response.statusCode == 200) {
        return SunatResult.fromJson(response.data);
      }
    } catch (e) {
      if (e is DioException) {
        print('Error Decolecta RUC API: ${e.response?.statusCode} - ${e.message}');
      }
    }
    return null;
  }

  static Future<Map<String, String>?> _tryDniEndpoint(String url, String dni) async {
    final String proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    try {
      final response = await _dio.get(
        '$proxyUrl$url',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiToken',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200) {
        final rawData = response.data;
        print('DECOLECTA DATA ($url): $rawData');
        
        final data = rawData is Map ? rawData : {};
        final Map<String, dynamic> actualData = (data['data'] is Map) ? data['data'] : data;
        
        // Mapeo exhaustivo basado en el log del usuario
        final String nombres = (actualData['first_name'] ?? actualData['nombres'] ?? actualData['nombre'] ?? '').toString();
        final String apellPaterno = (actualData['first_last_name'] ?? actualData['apellido_paterno'] ?? actualData['apellidoPaterno'] ?? '').toString();
        final String apellMaterno = (actualData['second_last_name'] ?? actualData['apellido_materno'] ?? actualData['apellidoMaterno'] ?? '').toString();
        
        // Priorizar el nombre completo si existe
        String nombreCompleto = actualData['full_name'] ?? actualData['fullName'] ?? '';
        if (nombreCompleto.isEmpty) {
          nombreCompleto = '$nombres $apellPaterno $apellMaterno'.trim();
        }
        
        if (nombreCompleto.isNotEmpty) {
          return {
            'nombres': nombreCompleto,
            'dni': dni,
          };
        }
      }
    } catch (e) {
      print('Aviso: Error en endpoint $url: $e');
    }
    return null;
  }

  static Future<Map<String, String>?> consultarDni(String dni) async {
    // Intentar con el endpoint estándar
    var result = await _tryDniEndpoint('https://api.decolecta.com/v1/reniec/dni?numero=$dni', dni);
    
    // Si falla, intentar con el endpoint alternativo
    if (result == null) {
      result = await _tryDniEndpoint('https://api.decolecta.com/v1/dni?numero=$dni', dni);
    }
    
    return result;
  }
}
