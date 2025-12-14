// FILE: src/pages/api/products/[slug].ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { DB } = locals.runtime.env;
    const { slug } = params;

    const product = await DB.prepare(`
      SELECT * FROM products WHERE slug = ? AND active = 1
    `).bind(slug).first();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results: sizes } = await DB.prepare(`
      SELECT * FROM product_sizes WHERE product_id = ? ORDER BY position
    `).bind(product.id).all();

    const { results: flavors } = await DB.prepare(`
      SELECT * FROM product_flavors WHERE product_id = ? ORDER BY position
    `).bind(product.id).all();

    const { results: addons } = await DB.prepare(`
      SELECT * FROM product_addons WHERE product_id = ? ORDER BY position
    `).bind(product.id).all();

    return new Response(JSON.stringify({
      ...product,
      sizes,
      flavors,
      addons
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};