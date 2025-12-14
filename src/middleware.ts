// FILE: src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathMatch = url.pathname.match(/^\/m(\d+)/);
  
  if (pathMatch) {
    const tableNumber = parseInt(pathMatch[1]);
    const { DB } = context.locals.runtime.env;
    
    const table = await DB.prepare(
      'SELECT id, table_number FROM tables WHERE table_number = ? AND active = 1'
    ).bind(tableNumber).first();
    
    if (table) {
      context.locals.orderOrigin = {
        type: 'internal',
        tableNumber,
        tableId: table.id as string
      };
    }
  } else if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/pedido')) {
    context.locals.orderOrigin = {
      type: 'external'
    };
  }
  
  return next();
});