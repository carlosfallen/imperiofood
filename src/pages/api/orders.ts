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

    await DB.prepare(`
      INSERT INTO orders (
        id, order_type, table_id, table_number, customer_name, customer_phone,
        customer_address, customer_postal_code, delivery_fee,
        subtotal, total, payment_method, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      orderId,
      orderData.order_type,
      orderData.table_id || null,
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