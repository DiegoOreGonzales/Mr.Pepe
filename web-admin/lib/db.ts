import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mrpepepassword@localhost:5432/mrpepe';

const pool = new Pool({
  connectionString,
  ssl: false,
});

let migrationExecuted = false;

/**
 * Asegura que las columnas tributarias de SUNAT existan en la tabla orders
 * sin borrar ni alterar los registros existentes de la base de datos.
 */
async function ensureSchema() {
  if (migrationExecuted) return;
  try {
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sunat_status VARCHAR(50) DEFAULT 'PENDIENTE';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sunat_hash VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sunat_qr TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sunat_cdr_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sunat_cdr_desc TEXT;
    `);
    migrationExecuted = true;
  } catch (err) {
    // Ignorar si la tabla se está inicializando por primera vez
    console.warn('Verificación automática de esquema SUNAT en ejecución:', err);
  }
}

export const query = async (text: string, params?: any[]) => {
  await ensureSchema();
  return pool.query(text, params);
};

export default pool;
