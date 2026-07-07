# 🍗 Guía del Sistema Mr. Pepe (Manual de Usuario)

Este documento detalla el funcionamiento y la administración del ecosistema digital de Mr. Pepe, incluyendo el Panel Web, el Sistema de Cocina y la Facturación.

---

## 📍 1. Configuración de Identidad
El sistema está configurado con los datos oficiales del negocio para todos los comprobantes y reportes:
- **RUC:** 10418236103
- **Dirección:** JR. JUNIN 413 - EL TAMBO - HUANCAYO
- **Marca:** MR. PEPE (Sin menciones a "El Brasero")

## 👤 2. Acceso al Sistema
Para ingresar a los módulos administrativos y de cocina:
- **URL Base:** `http://192.168.1.13:3000`
- **Email:** `admin@chioschicken.com`
- **Contraseña:** `admin123456`

---

## 🖥️ 3. Módulos del Panel Web

### 📊 Dashboard (Panel de Control)
- **Ruta:** `/dashboard`
- **Uso:** Gestión de mesas en tiempo real, visualización de pedidos activos y acceso rápido a facturación.

### 🧾 Facturación y Comprobantes
- **Ruta:** `/facturacion`
- **Uso:** Emisión de Boletas y Facturas. 
- **Impresión:** Optimizada para impresoras térmicas de **80mm**. Al imprimir, asegúrate de que los márgenes en el navegador estén configurados como "Ninguno" para un ajuste perfecto.

### 📈 Reportes y Analítica
- **Ruta:** `/reportes`
- **Exportación:** El botón "Exportar CSV" genera un archivo compatible con Excel (UTF-8 con separador `;`) que incluye todas las ventas del periodo seleccionado.

---

## 🍳 4. Visualización de Cocina (KDS)

Hemos implementado dos versiones para asegurar que funcione en cualquier hardware:

### 📺 A. Pantalla Moderna (PCs / Tablets nuevas)
- **URL:** `http://192.168.1.13:3000/kitchen-display`
- **Uso:** Pantallas de alta resolución. Requiere un navegador moderno (Chrome, Edge o Safari actualizado).

### 📺 B. TV Antigua / iPhone 7 (Versión de Legado)
- **URL:** `http://192.168.1.13:3000/cocina-tv.html`
- **Uso:** Específicamente diseñada para tu **LG TV 2016** y dispositivos antiguos.
- **Ventajas:** 
  - No consume recursos del procesador de la TV.
  - Conexión ultra-estable por "Long Polling".
  - **Auto-login:** Entra directamente a la cocina sin pedir contraseña.

---

## 🛠️ 5. Mantenimiento y Servidor

### Cómo encender el sistema
Si el sistema web no carga, ejecuta este comando en la terminal de la computadora principal:
```powershell
npm run start -- -p 3000 -H 192.168.1.13
```

### Solución de errores comunes:
1. **"Permission Denied" en la TV:** 
   - Entra a [Firebase Console](https://console.firebase.google.com/).
   - Ve a **Firestore Database > Rules**.
   - Asegúrate de que las reglas permitan lectura y escritura a usuarios autenticados.
2. **La página sale en blanco en la TV:**
   - Asegúrate de estar usando la URL que termina en `.html`.
   - Verifica que la TV esté en la misma red Wi-Fi que la PC.

---

*Guía generada para el equipo de Mr. Pepe. Mayo 2026.*
