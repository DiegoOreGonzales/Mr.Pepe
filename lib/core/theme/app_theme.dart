import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Paleta de Colores - Inspirada en "El Brasero"
  static const Color primaryColor = Color(0xFF944A00);
  static const Color primaryContainer = Color(0xFFE67E22);
  static const Color secondaryColor = Color(0xFF865300);
  static const Color backgroundColor = Color(0xFFF7F9FF);
  static const Color onBackgroundColor = Color(0xFF091D2E);
  static const Color successColor = Color(0xFF2ECC71);
  static const Color occupiedColor = Color(0xFFE74C3C);
  static const Color reservedColor = Color(0xFF3498DB);
  static const Color outlineColor = Color(0xFF897365);

  static const LinearGradient emberGradient = LinearGradient(
    colors: [primaryColor, primaryContainer],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: secondaryColor,
        surface: backgroundColor,
        onSurface: onBackgroundColor,
        error: occupiedColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      textTheme: GoogleFonts.beVietnamProTextTheme().copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: onBackgroundColor,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: onBackgroundColor,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: onBackgroundColor,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(fontWeight: FontWeight.bold),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.grey.shade100),
        ),
      ),
    );
  }
}
