-- Script de Inicialización de la Base de Datos - Mr. Pepe / Chio's Chicken
-- Este script se ejecuta automáticamente al levantar el contenedor de la base de datos.

-- 1. Tabla de Usuarios (Autenticación y Roles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Mesas (Gestión de Salón)
CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(50) PRIMARY KEY,
    numero INT UNIQUE NOT NULL,
    capacidad INT NOT NULL DEFAULT 4,
    status VARCHAR(50) NOT NULL DEFAULT 'libre',
    encargado VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE
);

-- 3. Tabla de Pedidos (KDS y Caja)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_numero INT NOT NULL,
    items JSONB NOT NULL, -- Arreglo de ítems del pedido
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    total NUMERIC(10, 2) NOT NULL,
    cliente_nombre VARCHAR(255),
    cliente_documento VARCHAR(50),
    tipo_documento VARCHAR(50),
    voucher_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Alertas (Notificación de Llamados de Cliente)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    mesa INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Semillas de Datos Iniciales (Seeders)

-- Crear Usuario Administrador Principal por Defecto: admin@chioschicken.com / admin123456
INSERT INTO users (nombre, email, password_hash, role)
VALUES (
    'Administrador Chios', 
    'admin@chioschicken.com', 
    '$2b$10$MWV3uMSUdrk6B5p6V7wUV.tKwvxiC5q3nfCdj7t8Lpigug6aOuhNa',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Crear Mesero Genérico por Defecto: mesero@chioschicken.com / mesero123456
INSERT INTO users (nombre, email, password_hash, role)
VALUES (
    'Mesero Principal', 
    'mesero@chioschicken.com', 
    '$2b$10$bRsf5/BFZH4z.ae4lu2X1ucCM73Lss2saPOb/lsfXVrdoiUfmNtju',
    'mesero'
) ON CONFLICT (email) DO NOTHING;

-- Crear Cocinero Genérico por Defecto: cocinero@chioschicken.com / cocina123456
INSERT INTO users (nombre, email, password_hash, role)
VALUES (
    'Cocinero Principal', 
    'cocinero@chioschicken.com', 
    '$2b$10$4M6VoefSaKiuHMXUoOGR9eWjCrgI7dPggJw.6iIDoE/t647ArHFYW',
    'cocina'
) ON CONFLICT (email) DO NOTHING;

-- Crear las 40 Mesas por Defecto
INSERT INTO tables (id, numero, capacidad, status)
SELECT 
    'mesa_' || i, 
    i, 
    4, 
    'libre'
FROM generate_series(1, 40) AS i
ON CONFLICT (id) DO NOTHING;
