// Configuración Centralizada de Facturación Electrónica SUNAT - Mr. Pepe
export const SUNAT_CONFIG = {
  // Datos del Emisor / Contribuyente (Formulario 7140)
  ruc: process.env.SUNAT_RUC || "10418236103",
  razonSocial: process.env.SUNAT_RAZON_SOCIAL || "DE LA CRUZ BALDEON ROCIO ELENA",
  nombreComercial: process.env.SUNAT_NOMBRE_COMERCIAL || "MR. PEPE",
  direccion: process.env.SUNAT_DIRECCION || "LIMA - PERU",
  departamento: process.env.SUNAT_DEPARTAMENTO || "LIMA",
  provincia: process.env.SUNAT_PROVINCIA || "LIMA",
  distrito: process.env.SUNAT_DISTRITO || "LIMA",
  ubigeo: process.env.SUNAT_UBIGEO || "150101",

  // Certificado Digital Tributario (CDT)
  certPin: process.env.SUNAT_CERT_PIN || "RocioDeLaCruz3101",
  certPath: process.env.SUNAT_CERT_PATH || "./certs/certificado.pfx",

  // Credenciales Clave SOL (Usuario Secundario)
  usuarioSol: process.env.SUNAT_USUARIO_SOL || "",
  claveSol: process.env.SUNAT_CLAVE_SOL || "",

  // Modo de operación:
  // - "DIRECTO": Firma local XML UBL 2.1 con el certificado .pfx y envía a SOAP SUNAT
  // - "FACTURALO": Envía el JSON a la API de Facturalo PRO auto-hospedado
  // - "SIMULADO": Modo contingencia/offline que genera QR y Hash válidos para imprimir tickets sin bloquear la caja
  modo: (process.env.SUNAT_MODO as "DIRECTO" | "FACTURALO" | "SIMULADO") || "SIMULADO",
  ambiente: (process.env.SUNAT_AMBIENTE as "beta" | "produccion") || "beta",

  // Endpoints para Facturalo / API externa (si se usa)
  facturaloUrl: process.env.SUNAT_FACTURALO_URL || "http://localhost:8000",
  facturaloToken: process.env.SUNAT_FACTURALO_TOKEN || "",

  // Series predeterminadas oficiales de SUNAT
  series: {
    boleta: "B001",
    factura: "F001",
    notaCreditoBoleta: "BC01",
    notaCreditoFactura: "FC01",
  },
};
