# 🛡️ GUÍA DE DESPLIEGUE SEGURO (CERO PÉRDIDA DE DATOS)
## Sistema POS Mister Pepe II - Integración SUNAT

Este documento detalla las instrucciones exactas para aplicar la actualización de Facturación Electrónica en la computadora de producción de la dueña **sin alterar, borrar ni reiniciar** los datos existentes de la base de datos (pedidos, mesas, productos, usuarios).

---

## 1. ⚠️ REGLAS DE ORO DE SEGURIDAD (LO QUE NUNCA DEBES HACER)

Para proteger la base de datos de la dueña:
* ❌ **NUNCA** ejecutes `docker compose down -v` (el parámetro `-v` elimina los volúmenes de datos).
* ❌ **NUNCA** ejecutes `docker volume prune` ni `docker volume rm postgres_data`.
* ❌ **NUNCA** borres la carpeta donde Docker almacena los datos de PostgreSQL.

---

## 2. 📋 PASO A PASO DEL PROCEDIMIENTO SEGURO

Ejecuta estos pasos en la terminal (PowerShell o CMD) de la máquina de la dueña:

### Paso 0: Respaldo Preventivo de Seguridad (Recomendado)
Antes de actualizar, genera una copia de seguridad exacta de toda la base de datos ejecutando este comando (toma 3 segundos):
```powershell
docker exec chios_postgres_db pg_dump -U postgres mrpepe > backup_mrpepe_seguridad.sql
```
*Si algo ocurriera en la máquina, este archivo `.sql` contiene toda la información de la pollería para restaurarla en cualquier momento.*

---

### Paso 1: Descargar los Últimos Cambios de GitHub
Ubícate en la carpeta raíz del proyecto (`Mr.Pepe`):
```powershell
git pull origin main
```

---

### Paso 2: Configurar las Variables de Entorno
Si no existe el archivo `.env.local` en `web-admin`, créalo a partir de la plantilla:
```powershell
cp web-admin/.env.local.example web-admin/.env.local
```
Abre `web-admin/.env.local` con el Bloc de Notas y verifica/completa:
* `SUNAT_RUC=10418236103`
* `SUNAT_RAZON_SOCIAL="DE LA CRUZ BALDEON ROCIO ELENA"`
* `SUNAT_NOMBRE_COMERCIAL="MISTER PEPE II"`
* `SUNAT_CERT_PIN="RocioDeLaCruz3101"`
* `SUNAT_USUARIO_SOL="EL_USUARIO_CREADO_EN_SOL"`
* `SUNAT_CLAVE_SOL="LA_CLAVE_CREADA_EN_SOL"`

---

### Paso 3: Colocar el Archivo del Certificado Digital
Copia el archivo descargado de SUNAT (`.pfx` o `.p12`) dentro de la carpeta:
```text
Mr.Pepe/web-admin/certs/certificado.pfx
```

---

### Paso 4: Reconstruir ÚNICAMENTE el Contenedor Web
Para actualizar la pantalla y los tickets **sin reiniciar ni tocar el contenedor de la Base de Datos**:
```powershell
docker compose up -d --no-deps --build web
```

> **¿Por qué este comando es 100% seguro?**
> * `--no-deps`: Le dice a Docker que **no toque** el contenedor de PostgreSQL (`chios_postgres_db`).
> * `--build web`: Compila únicamente la nueva interfaz web de Next.js.
> * Al iniciar la web, se ejecuta la migración automática no destructiva (`ALTER TABLE orders ADD COLUMN IF NOT EXISTS...`), añadiendo las columnas de SUNAT sin borrar ningún registro anterior.

---

## 3. 🔍 VERIFICACIÓN FINAL

1. Abre el navegador en `http://localhost:3000`.
2. Ve a la sección **Facturación**:
   - Comprueba que los pedidos anteriores siguen apareciendo en la tabla.
   - Observa la nueva columna **Estado SUNAT**.
   - Haz clic en **Imprimir** en cualquier comprobante y constata el nuevo membrete **MISTER PEPE II**, RUC `10418236103`, el desglose del **18% de IGV** y el **Código QR de SUNAT**.
