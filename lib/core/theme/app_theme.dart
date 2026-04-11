import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ── Paleta de Colores — El Brasero ──────────────────────────────────────
  static const Color primaryColor     = Color(0xFFBF391B); // Rojo brasero
  static const Color primaryDark      = Color(0xFF8C2510); // Variante oscura
  static const Color primaryLight     = Color(0xFFE54D2A); // Variante clara
  static const Color primaryContainer = Color(0xFFE54D2A);

  // Neutros
  static const Color black        = Color(0xFF0D0D0D);
  static const Color darkSurface  = Color(0xFF1A1A1A); // Sidebar
  static const Color darkCard     = Color(0xFF242424); // Cards en sidebar
  static const Color white        = Color(0xFFFFFFFF);
  static const Color offWhite     = Color(0xFFF8F9FA);
  static const Color lightGray    = Color(0xFFF0F2F5);
  static const Color borderGray   = Color(0xFFE4E7EC);
  static const Color textMuted    = Color(0xFF9AA0A6);

  // Estados de mesas
  static const Color successColor  = Color(0xFF1A8952);
  static const Color occupiedColor = Color(0xFFBF391B);
  static const Color reservedColor = Color(0xFF1A6FBF);

  // Aliases de compatibilidad
  static const Color secondaryColor    = primaryDark;
  static const Color onBackgroundColor = black;
  static const Color backgroundColor   = offWhite;
  static const Color outlineColor      = borderGray;

  // Gradientes
  static const LinearGradient emberGradient = LinearGradient(
    colors: [primaryDark, primaryColor, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient sidebarGradient = LinearGradient(
    colors: [Color(0xFF111111), Color(0xFF1A1A1A)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ── Tema principal (área de contenido) ───────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: primaryDark,
        surface: white,
        onSurface: black,
        error: occupiedColor,
      ),
      scaffoldBackgroundColor: lightGray,
      visualDensity: VisualDensity.standard,
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w800, color: black, fontSize: 32),
        headlineLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w700, color: black, fontSize: 26),
        headlineMedium: GoogleFonts.inter(
            fontWeight: FontWeight.w700, color: black, fontSize: 22),
        titleLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w600, color: black, fontSize: 18),
        titleMedium: GoogleFonts.inter(
            fontWeight: FontWeight.w600, color: black, fontSize: 15),
        bodyLarge: GoogleFonts.inter(color: black, fontSize: 14),
        bodyMedium:
            GoogleFonts.inter(color: Color(0xFF444444), fontSize: 13),
        labelLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w700, fontSize: 13, letterSpacing: 0.5),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: white,
          textStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              letterSpacing: 0.5),
          padding:
              const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          elevation: 0,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor, width: 1.5),
          textStyle:
              GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
          padding:
              const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          textStyle:
              GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ),
      cardTheme: CardThemeData(
        color: white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: borderGray, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: offWhite,
        hintStyle: GoogleFonts.inter(color: textMuted, fontSize: 13),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: borderGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: borderGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: primaryColor, width: 1.5),
        ),
      ),
      dividerTheme: const DividerThemeData(
          color: borderGray, thickness: 1, space: 0),
      appBarTheme: AppBarTheme(
        backgroundColor: white,
        foregroundColor: black,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w700, fontSize: 18, color: black),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: lightGray,
        selectedColor: primaryColor.withOpacity(0.12),
        labelStyle:
            GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
        side: const BorderSide(color: borderGray),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
