import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query("SELECT * FROM alerts WHERE status = 'pending' ORDER BY created_at ASC");
    const mapped = res.rows.map(row => ({
      id: row.id,
      type: row.type,
      mesa: row.mesa,
      status: row.status,
      createdAt: row.created_at,
    }));
    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    console.error('Error fetching alerts:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, mesa } = await request.json();
    
    if (!type || mesa === undefined) {
      return NextResponse.json({ success: false, error: 'Tipo y Mesa de alerta requeridos' }, { status: 400 });
    }
    
    await query(
      "INSERT INTO alerts (type, mesa, status, created_at) VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)",
      [type, mesa]
    );
    
    return NextResponse.json({ success: true, message: 'Alerta creada con éxito' });
  } catch (e: any) {
    console.error('Error creating alert:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID y Estado de alerta requeridos' }, { status: 400 });
    }
    await query("UPDATE alerts SET status = $1 WHERE id = $2", [status, id]);
    return NextResponse.json({ success: true, message: 'Alerta actualizada' });
  } catch (e: any) {
    console.error('Error updating alert:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
