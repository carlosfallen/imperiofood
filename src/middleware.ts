// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  const pathMatch = url.pathname.match(/^\/m(\d+)/);

  if (pathMatch) {
    const tableNumber = Number(pathMatch[1]);
    const { DB } = context.locals.runtime.env;

    const table = await DB.prepare(
      'SELECT id, table_number FROM tables WHERE table_number = ? AND active = 1'
    ).bind(tableNumber).first();

    if (table) {
      context.cookies.set(
        'order_origin',
        JSON.stringify({
          type: 'internal',
          tableId: table.id,
          tableNumber
        }),
        { path: '/' }
      );
    }
  }

  const cookie = context.cookies.get('order_origin');

  if (cookie) {
    context.locals.orderOrigin = JSON.parse(cookie.value);
  } else if (
    !url.pathname.startsWith('/admin') &&
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/pedido')
  ) {
    context.locals.orderOrigin = { type: 'external' };
  }

  return next();
});
