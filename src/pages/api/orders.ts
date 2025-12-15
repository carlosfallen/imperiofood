// FILE: src/pages/api/orders.ts
import type { APIRoute } from 'astro';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = locals.runtime.env;
    const orderData = await request.json();

    const orderId = generateId();
    const currentTimestamp = Math.floor(Date.now() / 1000);

      const tableId =
    locals.orderOrigin?.type === 'internal'
      ? locals.orderOrigin.tableId
      : null;

      if (tableId) {
  const exists = await DB.prepare(
    'SELECT id FROM tables WHERE id = ?'
  ).bind(tableId).first();

  if (!exists) {
    return new Response(JSON.stringify({
      error: 'Mesa inválida'
    }), { status: 400 });
  }
}

await DB.prepare(`
  INSERT INTO orders (
    id,
    order_type,
    table_id,
    table_number,
    customer_name,
    customer_phone,
    customer_address,
    customer_postal_code,
    delivery_fee,
    subtotal,
    total,
    payment_method,
    notes,
    status,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
`).bind(
  orderId,
  orderData.order_type,
  tableId,
  orderData.table_number || null,
  orderData.customer_name || null,
  orderData.customer_phone || null,
  orderData.customer_address || null,
  orderData.customer_postal_code || null,
  orderData.delivery_fee || 0,
  orderData.subtotal,
  orderData.total,
  orderData.payment_method || null,
  orderData.notes || null,
  currentTimestamp
).run();

for (const item of orderData.items) {
  const product = await DB.prepare(
    'SELECT id FROM products WHERE id = ?'
  ).bind(item.product_id).first();

  if (!product) {
    console.error('PRODUCT FK INVALID', item.product_id, item.product_name);
    throw new Error(`Produto inválido: ${item.product_name}`);
  }
}

    for (const item of orderData.items) {
      const itemId = generateId();
      
      await DB.prepare(`
        INSERT INTO order_items (
          id, order_id, product_id, product_name, size_name,
          flavor_name, addons, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId,
        orderId,
        item.product_id,
        item.product_name,
        item.size_name || null,
        item.flavor_name || null,
        item.addons || null,
        item.quantity,
        item.unit_price,
        item.total_price
      ).run();
    }

    return new Response(JSON.stringify({ 
      success: true,
      orderId 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};