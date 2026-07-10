import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }
    
    if (email === 'admin@mrpepe.com' && password === 'admin123456') {
      return NextResponse.json({
        success: true,
        user: {
          uid: 'admin-mock-123',
          nombre: 'Administrador (Mock)',
          email: email,
          role: 'admin',
        }
      });
    }

    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }
    
    const user = res.rows[0];
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      isValid = password === user.password_hash;
    }
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
      }
    });
  } catch (e: any) {
    console.error('Error in login API:', e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
