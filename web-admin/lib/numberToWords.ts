export function numberToWords(number: number): string {
  if (number === 0) return 'CERO CON 00/100 SOLES';
  
  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);
  
  const words = convertIntegerToWords(integerPart);
  
  const decimalStr = decimalPart.toString().padStart(2, '0');
  
  return `${words.toUpperCase()} CON ${decimalStr}/100 SOLES`;
}

function convertIntegerToWords(n: number): string {
  if (n === 0) return 'cero';

  if (n < 0) return `menos ${convertIntegerToWords(Math.abs(n))}`;

  let words = '';

  if (n >= 1000000) {
    words += `${convertIntegerToWords(Math.floor(n / 1000000))} millones `;
    n %= 1000000;
  }

  if (n >= 1000) {
    if (Math.floor(n / 1000) === 1) {
      words += 'mil ';
    } else {
      words += `${convertIntegerToWords(Math.floor(n / 1000))} mil `;
    }
    n %= 1000;
  }

  if (n >= 100) {
    if (n === 100) {
      words += 'cien ';
    } else {
      const centenas = [
        '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
        'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'
      ];
      words += `${centenas[Math.floor(n / 100)]} `;
    }
    n %= 100;
  }

  if (n > 0) {
    if (n < 10) {
      const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
      words += unidades[n];
    } else if (n < 20) {
      const especiales = [
        'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
        'diecisiete', 'dieciocho', 'diecinueve'
      ];
      words += especiales[n - 10];
    } else if (n < 30) {
      if (n === 20) {
        words += 'veinte';
      } else {
        const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        words += `veinti${unidades[n - 20]}`;
      }
    } else {
      const decenas = [
        '', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta',
        'setenta', 'ochenta', 'noventa'
      ];
      words += decenas[Math.floor(n / 10)];
      if (n % 10 > 0) {
        const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        words += ` y ${unidades[n % 10]}`;
      }
    }
  }

  return words.trim();
}
