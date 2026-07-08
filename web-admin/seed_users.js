// Script para inicializar usuarios en la base de datos
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:mrpepepassword@localhost:5432/mrpepe',
  ssl: false
});

async function initUsers() {
  try {
    // Crear tabla users si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla users verificada/creada');

    // Hashear contraseñas
    const adminHash = await bcrypt.hash('admin123456', 10);
    const meseroHash = await bcrypt.hash('mesero123456', 10);
    const cocineroHash = await bcrypt.hash('cocina123456', 10);

    // Insertar usuarios
    const users = [
      { nombre: 'Administrador Mr Pepe', email: 'admin@mrpepe.com', hash: adminHash, role: 'admin' },
      { nombre: 'Mesero Principal', email: 'mesero@mrpepe.com', hash: meseroHash, role: 'mesero' },
      { nombre: 'Cocinero Principal', email: 'cocinero@mrpepe.com', hash: cocineroHash, role: 'cocina' },
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (nombre, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
        [u.nombre, u.email, u.hash, u.role]
      );
      console.log(`✅ Usuario ${u.email} creado/actualizado`);
    }

    // Verificar
    const res = await pool.query('SELECT id, nombre, email, role FROM users');
    console.log('\n📋 Usuarios en la base de datos:');
    console.table(res.rows);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

initUsers();
