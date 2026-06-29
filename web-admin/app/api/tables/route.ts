import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM tables ORDER BY numero ASC');
    // Mapeamos a la estructura esperada por los hooks y por Flutter
    const mapped = res.rows.map(row => ({
      id: row.id,
      numero: row.numero,
      capacidad: row.capacidad,
      status: row.status,
      encargado: row.encargado,
      startTime: row.start_time,
    }));
    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    console.error('Error fetching tables:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, encargado } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Mesa ID y Estado requeridos' }, { status: 400 });
    }
    
    const startTime = status === 'ocupada' ? new Date() : null;
    
    await query(
      'UPDATE tables SET status = $1, encargado = $2, start_time = $3 WHERE id = $4',
      [status, encargado || null, startTime, id]
    );
    
    return NextResponse.json({ success: true, message: 'Estado de mesa actualizado' });
  } catch (e: any) {
    console.error('Error updating table:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
