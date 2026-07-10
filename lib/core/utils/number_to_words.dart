String numberToWords(double number) {
  if (number == 0) return 'CERO CON 00/100 SOLES';
  
  final int integerPart = number.truncate();
  final int decimalPart = ((number - integerPart) * 100).round();
  
  String words = _convertIntegerToWords(integerPart);
  
  String decimalStr = decimalPart.toString().padLeft(2, '0');
  
  return '${words.toUpperCase()} CON $decimalStr/100 SOLES';
}

String _convertIntegerToWords(int n) {
  if (n == 0) return 'cero';

  if (n < 0) return 'menos ${_convertIntegerToWords(n.abs())}';

  String words = '';

  if (n >= 1000000) {
    words += '${_convertIntegerToWords(n ~/ 1000000)} millones ';
    n %= 1000000;
  }

  if (n >= 1000) {
    if (n ~/ 1000 == 1) {
      words += 'mil ';
    } else {
      words += '${_convertIntegerToWords(n ~/ 1000)} mil ';
    }
    n %= 1000;
  }

  if (n >= 100) {
    if (n == 100) {
      words += 'cien ';
    } else {
      final centenas = [
        '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
        'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'
      ];
      words += '${centenas[n ~/ 100]} ';
    }
    n %= 100;
  }

  if (n > 0) {
    if (n < 10) {
      final unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
      words += unidades[n];
    } else if (n < 20) {
      final especiales = [
        'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
        'diecisiete', 'dieciocho', 'diecinueve'
      ];
      words += especiales[n - 10];
    } else if (n < 30) {
      if (n == 20) {
        words += 'veinte';
      } else {
        final unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        words += 'veinti${unidades[n - 20]}';
      }
    } else {
      final decenas = [
        '', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta',
        'setenta', 'ochenta', 'noventa'
      ];
      words += decenas[n ~/ 10];
      if (n % 10 > 0) {
        final unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        words += ' y ${unidades[n % 10]}';
      }
    }
  }

  return words.trim();
}
