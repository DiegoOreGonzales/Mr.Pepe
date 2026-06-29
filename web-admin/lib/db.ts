import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mrpepepassword@localhost:5432/mrpepe';

const pool = new Pool({
  connectionString,
  ssl: false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
