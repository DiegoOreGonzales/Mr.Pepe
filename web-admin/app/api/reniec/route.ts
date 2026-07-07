import { NextResponse } from 'next/server';

const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpmY2M5NTAxMjMwOUBnbWFpbC5jb20ifQ.UaK6eecpbt-mVnF9hI-BYSHtl6QQ5hCLU1MNItWe9P8";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const ruc = searchParams.get('ruc');

    if (dni) {
      if (dni.length !== 8) {
        return NextResponse.json({ success: false, error: 'El DNI debe tener 8 dígitos' }, { status: 400 });
      }

      const response = await fetch(`https://dniruc.apisperu.com/api/v1/dni/${dni}?token=${API_TOKEN}`);
      if (!response.ok) {
        return NextResponse.json({ success: false, error: 'DNI no encontrado' }, { status: 404 });
      }
      const data = await response.json();

      if (data.success === false) {
        return NextResponse.json({ success: false, error: 'DNI no encontrado en RENIEC' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          nombres: data.nombres || '',
          apellidoPaterno: data.apellidoPaterno || '',
          apellidoMaterno: data.apellidoMaterno || '',
          nombreCompleto: `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim(),
          dni: dni,
        }
      });
    }

    if (ruc) {
      if (ruc.length !== 11) {
        return NextResponse.json({ success: false, error: 'El RUC debe tener 11 dígitos' }, { status: 400 });
      }

      const response = await fetch(`https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${API_TOKEN}`);
      if (!response.ok) {
        return NextResponse.json({ success: false, error: 'RUC no encontrado' }, { status: 404 });
      }
      const data = await response.json();

      if (data.success === false) {
        return NextResponse.json({ success: false, error: 'RUC no encontrado en SUNAT' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          ruc: data.ruc || ruc,
          razonSocial: data.razonSocial || '',
          direccion: data.direccion || 'SIN DIRECCIÓN REGISTRADA',
          estado: data.estado || '',
          condicion: data.condicion || '',
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Proporcione un DNI o RUC como parámetro' }, { status: 400 });
  } catch (e: any) {
    console.error('Error en consulta RENIEC/SUNAT:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
