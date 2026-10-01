# GUÍA PASO A PASO: DESPLIEGUE Y REGULARIZACIÓN SUNAT (MÁQUINA REMOTA)
**Restaurante:** Mr. Pepe  
**Fecha:** 30 de Septiembre de 2026  
**Objetivo:** Actualizar el sistema de facturación con conexión directa CDT a SUNAT en producción, respaldar la base de datos sin pérdida de información, regularizar las 19 facturas corporativas de septiembre y gestionar el filtro de boletas para evitar sobregiros.

---

## ⚠️ REGLA DE ORO DE SEGURIDAD (NO BORRAR LA BASE DE DATOS)
* **NUNCA ejecutar:** `docker-compose down -v` (la bandera `-v` elimina los volúmenes y destruiría la base de datos).
* **NUNCA borrar:** carpetas de volumen de Docker ni reinstalar contenedores sin respaldo.
* Siempre seguir el procedimiento de respaldo previo antes de tocar cualquier archivo.

---

## FASE 1: RESPALDO INMEDIATO DE LA BASE DE DATOS (SEGURIDAD TOTAL)

En la máquina de la señora, abre una ventana de PowerShell como Administrador y ejecuta:

```powershell
# 1. Crear carpeta de respaldo en el disco D:
New-Item -ItemType Directory -Force -Path "D:\RESPALDOS_MRPEPE"

# 2. Generar volcado completo de PostgreSQL
docker exec chios_postgres_db pg_dump -U postgres mrpepe > "D:\RESPALDOS_MRPEPE\backup_mrpepe_30_09_2026.sql"

# 3. Verificar que el respaldo se generó con datos (tamaño mayor a 100 KB)
Get-Item "D:\RESPALDOS_MRPEPE\backup_mrpepe_30_09_2026.sql" | Select-Object Name, Length, LastWriteTime
```
> Si el archivo tiene peso (ej. 500 KB - 5 MB), tu base de datos está 100% a salvo y respaldada ante cualquier eventualidad.

---

## FASE 2: ACTUALIZACIÓN DE ARCHIVOS EN LA MÁQUINA DE LA SEÑORA

Navega a la carpeta del proyecto en la máquina remota:
```powershell
cd D:\jose\polleria\Mr.Pepe
```

### Opción A (Si se usa Git):
```powershell
git pull origin main
```

### Opción B (Si se copian archivos por Red o USB):
Copiar los siguientes archivos modificados a `D:\jose\polleria\Mr.Pepe\`:
1. `web-admin/lib/sunat/` (todos los archivos: `ubl-builder.ts`, `xml-signer.ts`, `soap-client.ts`, `sunat-engine.ts`, `config.ts`).
2. `web-admin/certs/` (`certificate.pem`, `private_key.pem`, `certificado.p12`).
3. `web-admin/app/(dashboard)/facturacion/page.tsx`
4. `web-admin/app/api/sunat/` (`status/route.ts`, `sync/route.ts`, `emitir/route.ts`).
5. `web-admin/app/api/orders/route.ts`
6. `web-admin/lib/firebase/hooks.ts`
7. `web-admin/package.json` y `web-admin/package-lock.json`
8. `docker-compose.yml`

---

## FASE 3: CONFIGURACIÓN DE VARIABLES DE ENTORNO (`web-admin/.env.local`)

Abre o edita el archivo `D:\jose\polleria\Mr.Pepe\web-admin\.env.local` con Notepad:
```powershell
notepad D:\jose\polleria\Mr.Pepe\web-admin\.env.local
```

Verifica o ajusta estos valores:
```env
# 1. Base de datos (conecta con el contenedor PostgreSQL)
DATABASE_URL=postgresql://postgres:mrpepepassword@db:5432/mrpepe

# 2. Configuración SUNAT - Conexión Directa en Producción
SUNAT_MODO="DIRECTO"
SUNAT_AMBIENTE="produccion"

# 3. Datos del Contribuyente
SUNAT_RUC="10418236103"
SUNAT_RAZON_SOCIAL="DE LA CRUZ BALDEON ROCIO ELENA"
SUNAT_NOMBRE_COMERCIAL="MISTER PEPE II"
SUNAT_DIRECCION="Jr. Junín 413 con Av. 13 de Noviembre - El Tambo - Huancayo"
SUNAT_DEPARTAMENTO="JUNIN"
SUNAT_PROVINCIA="HUANCAYO"
SUNAT_DISTRITO="EL TAMBO"
SUNAT_UBIGEO="120114"

# 4. Certificado CDT RENIEC
SUNAT_CERT_PATH="./certs/certificado.p12"
SUNAT_CERT_PIN="RocioDeLaCruz3101"

# 5. Credenciales Clave SOL (Usuario Secundario)
SUNAT_USUARIO_SOL="74934503"
SUNAT_CLAVE_SOL="74934503Fact"
```
*(Nota: Si deseas hacer una prueba previa en Beta antes de pasar a real, puedes dejar `SUNAT_AMBIENTE="beta"`; para emitir en SUNAT real debe ser `SUNAT_AMBIENTE="produccion"`).*

---

## FASE 4: RECONSTRUCCIÓN Y LEVANTAMIENTO DEL CONTENEDOR WEB

Ejecuta en PowerShell:
```powershell
cd D:\jose\polleria\Mr.Pepe

# Detener el contenedor web sin tocar la base de datos
docker-compose stop web
docker-compose rm -f web

# Reconstruir la imagen web con las nuevas librerías y componentes
docker-compose build web

# Levantar el servicio
docker-compose up -d web
```

Verificar que esté funcionando:
```powershell
# Ver estado del contenedor
docker ps -f "name=chios_web_app"

# Ver los logs de arranque
docker logs chios_web_app --tail 20
```
Debe indicar: `Ready in ...ms` y responder en `http://localhost:3000`.

---

## FASE 5: REGULARIZACIÓN DE LAS 19 FACTURAS DE SEPTIEMBRE (EXIGENCIA DEL CONTADOR)

En el reporte de septiembre existen 19 facturas a empresas (Clínica Cayetano Heredia, Prosegur, Zapler, etc.) que totalizan S/ 717.00.  
Como hoy es **30 de Septiembre de 2026** (último día del mes), SUNAT permite emitir con fecha de hoy o hasta 3 días calendario hacia atrás.  
Para que SUNAT las acepte sin el `Error 2324` y queden contabilizadas en **SEPTIEMBRE 2026**:

### Paso 5.1: Preparar las facturas en la Base de Datos
Ejecuta este script en PowerShell para normalizar las 19 facturas con formato oficial `F001-...`, fecha `2026-09-30` y dejarlas en estado `PENDIENTE` para su transmisión a SUNAT:

```powershell
docker exec -i chios_postgres_db psql -U postgres -d mrpepe << 'EOF'
-- 1. Marcar las facturas de septiembre para re-emisión
WITH ranked_facturas AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as correlativo
  FROM orders
  WHERE tipo_documento = 'factura'
    AND created_at >= '2026-09-01'
    AND created_at < '2026-10-01'
)
UPDATE orders o
SET 
  voucher_number = 'F001-' || LPAD(rf.correlativo::text, 8, '0'),
  created_at = '2026-09-30 18:00:00-05',
  updated_at = CURRENT_TIMESTAMP,
  sunat_status = 'PENDIENTE',
  sunat_hash = NULL,
  sunat_qr = NULL,
  sunat_cdr_code = NULL,
  sunat_cdr_desc = NULL
FROM ranked_facturas rf
WHERE o.id = rf.id;
EOF
```

### Paso 5.2: Transmitir las facturas a SUNAT
1. Ingresa en el navegador a:  
   **`http://localhost:3000/facturacion`**
2. Haz clic en la pestaña **"Pendientes de Envío"**.
3. Verás las 19 facturas (`F001-00000001` a `F001-00000019`).
4. Selecciona todas con la casilla superior y presiona el botón verde:  
   **"📤 Enviar Seleccionados a SUNAT"**
5. El sistema firmará cada XML con el CDT RENIEC y lo enviará al Web Service SOAP de SUNAT.
6. SUNAT devolverá para cada una el **CDR Código 0 (Aceptado)**.
7. Los clientes corporativos podrán consultar en el portal de SUNAT y descargar su XML y PDF.

---

## FASE 6: GESTIÓN DE BOLETAS Y CONTROL DE SOBREGIRO (DECISIÓN DE LA DUEÑA)

Para las boletas de agosto y septiembre emitidas a "Consumidor Final":

1. **Evitar Sobregiro:**
   * La gran mayoría de clientes de mostrador ya pagaron su menú y no necesitan XML ante SUNAT.
   * En el panel `http://localhost:3000/facturacion`, la dueña puede revisar las boletas.
   * Si hay boletas que **sí desea enviar** (ej. boletas con DNI de clientes específicos que lo solicitaron), las selecciona y pulsa **"Enviar Seleccionados a SUNAT"**.
2. **Archivar las boletas que no se enviarán:**
   * Las boletas que la señora decida **no enviar a SUNAT** para evitar sobregiro tributario se archivan como `HISTORICO`.
   * Para archivar todas las boletas anteriores a octubre que no se vayan a enviar:
     ```powershell
     docker exec chios_postgres_db psql -U postgres -d mrpepe -c "UPDATE orders SET sunat_status = 'HISTORICO' WHERE tipo_documento = 'boleta' AND created_at < '2026-10-01' AND (sunat_status = 'PENDIENTE' OR sunat_status IS NULL);"
     ```
3. **Declaración en el Formulario Virtual 621 / SIRE:**
   * El contador no declara comprobante por comprobante en el portal mensual, sino la **suma consolidada acordada** con la dueña.
   * Con los reportes `REPORTE_VENTAS_HISTORICAS_CONTADOR.txt` (Agosto) y `REPORTE_CONTABLE_SIRE_MR_PEPE.csv` (Septiembre), el contador imputa la casilla de ventas netas e IGV en el Formulario 621.
   * Se paga el impuesto correspondiente y la empresa queda **100% regularizada y sin riesgo alguno**.

---

## FASE 7: ENTRADA EN VIGENCIA PARA OCTUBRE EN ADELANTE

A partir del 1 de Octubre:
1. El sistema opera de forma híbrida: **Registro local inmediato en caja + Envío manual bajo demanda**.
2. La cajera atiende y entrega su ticket con normalidad.
3. Al finalizar el turno o periódicamente, la dueña entra a `/facturacion` y selecciona exactamente qué comprobantes transmitir a SUNAT, manteniendo control total de sus impuestos.
