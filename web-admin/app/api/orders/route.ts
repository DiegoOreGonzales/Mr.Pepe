import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit') || '50';
    const mesaParam = searchParams.get('mesa');
    const unpaidParam = searchParams.get('unpaid');
    
    let res;
    if (mesaParam && unpaidParam === 'true') {
      res = await query(
        "SELECT * FROM orders WHERE mesa_numero = $1 AND status != 'pagado' ORDER BY created_at ASC",
        [parseInt(mesaParam)]
      );
    } else if (statusParam === 'active') {
      res = await query(
        "SELECT * FROM orders WHERE status IN ('pendiente', 'preparando', 'listo') ORDER BY created_at ASC"
      );
    } else if (statusParam === 'billing') {
      res = await query(
        "SELECT * FROM orders WHERE status IN ('pagado', 'entregado') ORDER BY created_at DESC LIMIT $1",
        [parseInt(limitParam)]
      );
    } else {
      res = await query(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT $1",
        [parseInt(limitParam)]
      );
    }
    
    const mapped = res.rows.map(row => ({
      id: row.id,
      mesaNumero: row.mesa_numero,
      items: row.items,
      status: row.status,
      total: parseFloat(row.total),
      clienteNombre: row.cliente_nombre,
      clienteDocumento: row.cliente_documento,
      tipoDocumento: row.tipo_documento,
      voucherNumber: row.voucher_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    console.error('Error fetching orders:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { mesaNumero, items, total } = await request.json();
    
    if (mesaNumero === undefined || !items || total === undefined) {
      return NextResponse.json({ success: false, error: 'Datos de orden incompletos' }, { status: 400 });
    }
    
    // Iniciar transacción implícita
    // 1. Crear el pedido
    const orderRes = await query(
      `INSERT INTO orders (mesa_numero, items, total, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'pendiente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [mesaNumero, JSON.stringify(items), total]
    );
    
    // 2. Marcar la mesa correspondiente como ocupada
    const tableId = `mesa_${mesaNumero}`;
    await query(
      "UPDATE tables SET status = 'ocupada', start_time = CURRENT_TIMESTAMP WHERE id = $1",
      [tableId]
    );
    
    const createdOrder = orderRes.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: createdOrder.id,
        mesaNumero: createdOrder.mesa_numero,
        items: createdOrder.items,
        status: createdOrder.status,
        total: parseFloat(createdOrder.total),
        createdAt: createdOrder.created_at,
      }
    });
  } catch (e: any) {
    console.error('Error creating order:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, items, total, clienteNombre, clienteDocumento, tipoDocumento, voucherNumber } = await request.json();
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de orden requerido' }, { status: 400 });
    }
    
    // Si viene items o total, actualizamos los detalles de la orden
    if (items !== undefined && total !== undefined) {
      await query(
        `UPDATE orders 
         SET items = $1, total = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [JSON.stringify(items), total, id]
      );
    }
    
    if (status) {
      // Si se trata de un cobro (checkout), actualizamos los datos y liberamos la mesa
      if (status === 'pagado') {
        // 1. Obtener la orden para saber la mesa
        const orderSearch = await query('SELECT mesa_numero FROM orders WHERE id = $1', [id]);
        if (orderSearch.rows.length > 0) {
          const mesaNumero = orderSearch.rows[0].mesa_numero;
          
          // 2. Actualizar orden a pagado con comprobante
          await query(
            `UPDATE orders 
             SET status = $1, cliente_nombre = $2, cliente_documento = $3, tipo_documento = $4, voucher_number = $5, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6`,
            [status, clienteNombre || null, clienteDocumento || null, tipoDocumento || null, voucherNumber || null, id]
          );
          
          // 3. Liberar Mesa
          const tableId = `mesa_${mesaNumero}`;
          await query(
            "UPDATE tables SET status = 'libre', encargado = NULL, start_time = NULL WHERE id = $1",
            [tableId]
          );
        } else {
          return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
        }
      } else {
        // Si es un cambio de estado normal (ej. preparando, listo, entregado)
        await query(
          'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [status, id]
        );
      }
    }
    
    return NextResponse.json({ success: true, message: 'Orden actualizada con éxito' });
  } catch (e: any) {
    console.error('Error updating order:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de orden requerido' }, { status: 400 });
    }
    
    const orderSearch = await query('SELECT mesa_numero, status FROM orders WHERE id = $1', [id]);
    if (orderSearch.rows.length > 0) {
      const { mesa_numero, status } = orderSearch.rows[0];
      
      await query('DELETE FROM orders WHERE id = $1', [id]);
      
      if (status !== 'pagado') {
        const tableId = `mesa_${mesa_numero}`;
        await query(
          "UPDATE tables SET status = 'libre', encargado = NULL, start_time = NULL WHERE id = $1",
          [tableId]
        );
      }
    } else {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Orden eliminada con éxito' });
  } catch (e: any) {
    console.error('Error deleting order:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
