// FILE: src/pages/api/orders/status.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = locals.runtime.env;
    const { orderId, status } = await request.json();

    await DB.prepare(`
      UPDATE orders SET status = ? WHERE id = ?
    `).bind(status, orderId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update order status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};