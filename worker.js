// worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API Routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path);
    }

    // Static pages
    if (path === '/' || path.startsWith('/m')) {
      return handleHome(request, env);
    }

    if (path.startsWith('/produto/')) {
      return handleProduct(request, env);
    }

    if (path === '/checkout') {
      return handleCheckout(request, env);
    }

    if (path.startsWith('/pedido/')) {
      return handleOrder(request, env);
    }

    if (path === '/admin') {
      return handleAdmin(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleAPI(request, env, path) {
  const url = new URL(request.url);

  if (path === '/api/products' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`
      SELECT 
        p.id, p.name, p.slug, p.serves_people, p.base_price, p.image_url,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = 1
      ORDER BY c.position, p.position
    `).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path.startsWith('/api/products/') && request.method === 'GET') {
    const slug = path.split('/').pop();
    
    const product = await env.DB.prepare(`
      SELECT * FROM products WHERE slug = ? AND active = 1
    `).bind(slug).first();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    const { results: sizes } = await env.DB.prepare(`
      SELECT * FROM product_sizes WHERE product_id = ? ORDER BY position
    `).bind(product.id).all();

    const { results: flavors } = await env.DB.prepare(`
      SELECT * FROM product_flavors WHERE product_id = ? ORDER BY position
    `).bind(product.id).all();

    const { results: addons } = await env.DB.prepare(`
      SELECT * FROM product_addons WHERE product_id = ? ORDER BY position
    `).bind(product.id).all();

    return new Response(JSON.stringify({ ...product, sizes, flavors, addons }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/orders' && request.method === 'POST') {
    const orderData = await request.json();
    const orderId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    await env.DB.prepare(`
      INSERT INTO orders (
        id, order_type, table_id, table_number, customer_name, customer_phone,
        customer_address, customer_postal_code, delivery_fee,
        subtotal, total, payment_method, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
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
      const itemId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      await env.DB.prepare(`
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

    return new Response(JSON.stringify({ success: true, orderId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/orders/status' && request.method === 'POST') {
    const { orderId, status } = await request.json();

    await env.DB.prepare(`
      UPDATE orders SET status = ? WHERE id = ?
    `).bind(status, orderId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

async function handleHome(request, env) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/m(\d+)/);
  
  let orderOrigin = { type: 'external' };
  
  if (pathMatch) {
    const tableNumber = parseInt(pathMatch[1]);
    const table = await env.DB.prepare(
      'SELECT id, table_number FROM tables WHERE table_number = ? AND active = 1'
    ).bind(tableNumber).first();
    
    if (table) {
      orderOrigin = {
        type: 'internal',
        tableNumber,
        tableId: table.id
      };
    }
  }

  const { results: products } = await env.DB.prepare(`
    SELECT 
      p.id, p.name, p.slug, p.serves_people, p.base_price, p.image_url,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1
    ORDER BY c.position, p.position
  `).all();

  const html = getHomeHTML(products, orderOrigin);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleProduct(request, env) {
  const slug = new URL(request.url).pathname.split('/').pop();
  
  const product = await env.DB.prepare(`
    SELECT * FROM products WHERE slug = ? AND active = 1
  `).bind(slug).first();

  if (!product) {
    return Response.redirect(new URL('/', request.url).toString(), 302);
  }

  const { results: sizes } = await env.DB.prepare(`
    SELECT * FROM product_sizes WHERE product_id = ? ORDER BY position
  `).bind(product.id).all();

  const { results: flavors } = await env.DB.prepare(`
    SELECT * FROM product_flavors WHERE product_id = ? ORDER BY position
  `).bind(product.id).all();

  const { results: addons } = await env.DB.prepare(`
    SELECT * FROM product_addons WHERE product_id = ? ORDER BY position
  `).bind(product.id).all();

  const html = getProductHTML(product, sizes, flavors, addons);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleCheckout(request, env) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/m(\d+)/);
  
  let orderOrigin = { type: 'external' };
  
  if (pathMatch) {
    const tableNumber = parseInt(pathMatch[1]);
    const table = await env.DB.prepare(
      'SELECT id, table_number FROM tables WHERE table_number = ? AND active = 1'
    ).bind(tableNumber).first();
    
    if (table) {
      orderOrigin = {
        type: 'internal',
        tableNumber,
        tableId: table.id
      };
    }
  }

  const html = getCheckoutHTML(orderOrigin);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleOrder(request, env) {
  const id = new URL(request.url).pathname.split('/').pop();
  
  const order = await env.DB.prepare(`
    SELECT * FROM orders WHERE id = ?
  `).bind(id).first();

  if (!order) {
    return Response.redirect(new URL('/', request.url).toString(), 302);
  }

  const { results: items } = await env.DB.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).bind(id).all();

  const html = getOrderHTML(order, items);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleAdmin(request, env) {
  const { results: allOrders } = await env.DB.prepare(`
    SELECT o.*, t.table_number, t.id as table_id_ref
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    ORDER BY 
      CASE o.status
        WHEN 'pending' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'delivered' THEN 4
        WHEN 'customer_left' THEN 5
        ELSE 6
      END,
      o.created_at DESC
  `).all();

  const ordersWithItems = await Promise.all(
    allOrders.map(async (order) => {
      const { results: items } = await env.DB.prepare(`
        SELECT * FROM order_items WHERE order_id = ?
      `).bind(order.id).all();
      return { ...order, items };
    })
  );

  const { results: tables } = await env.DB.prepare(`
    SELECT * FROM tables WHERE active = 1 ORDER BY table_number
  `).all();

  const html = getAdminHTML(ordersWithItems, tables);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function getBaseHTML(title, content) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${getGlobalCSS()}
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

function getGlobalCSS() {
  return `
    :root {
      --color-white: #FFFFFF;
      --color-gold: #D4AF37;
      --color-gold-light: #F4E4B7;
      --color-gold-dark: #B8941F;
      --color-black: #1A1A1A;
      --color-gray: #666666;
      --color-gray-light: #F5F5F5;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--color-black);
      background: var(--color-white);
      line-height: 1.6;
    }
    button { border: none; background: none; cursor: pointer; font-family: inherit; }
    a { text-decoration: none; color: inherit; }
    img, video { max-width: 100%; height: auto; display: block; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: var(--transition);
    }
    .btn-primary {
      background: var(--color-gold);
      color: var(--color-white);
    }
    .btn-primary:hover {
      background: var(--color-gold-dark);
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: var(--color-white);
      color: var(--color-gold);
      border: 2px solid var(--color-gold);
    }
  `;
}

function getHomeHTML(products, orderOrigin) {
  const productsHTML = products.map(p => `
    <a href="/produto/${p.slug}" class="menu-item">
      ${p.image_url ? `<div class="menu-item-image"><img src="${p.image_url}" alt="${p.name}"></div>` : ''}
      <div class="menu-item-content">
        <h3 class="menu-item-name">${p.name}</h3>
        <p class="menu-item-serves">Serve ${p.serves_people} ${p.serves_people === 1 ? 'pessoa' : 'pessoas'}</p>
        <p class="menu-item-price">A partir de <span class="price-value">R$ ${p.base_price.toFixed(2)}</span></p>
      </div>
    </a>
  `).join('');

  return getBaseHTML('Império Pizzas', `
    <style>
      .hero {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--color-white) 0%, var(--color-gold-light) 100%);
        text-align: center;
      }
      .hero-title { font-size: clamp(3rem, 8vw, 6rem); font-weight: 700; margin-bottom: 1rem; }
      .gold-text { color: var(--color-gold); display: block; }
      .hero-subtitle { font-size: clamp(1.25rem, 3vw, 2rem); color: var(--color-gray); margin-bottom: 1.5rem; }
      .menu-section { padding: 6rem 0; }
      .section-title { font-size: clamp(2.5rem, 5vw, 4rem); text-align: center; margin-bottom: 4rem; }
      .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
      }
      .menu-item {
        background: var(--color-white);
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        transition: var(--transition);
        display: flex;
        flex-direction: column;
      }
      .menu-item:hover { transform: translateY(-8px); }
      .menu-item-image { width: 100%; height: 250px; overflow: hidden; background: var(--color-gray-light); }
      .menu-item-image img { width: 100%; height: 100%; object-fit: cover; }
      .menu-item-content { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
      .menu-item-name { font-size: 1.5rem; margin-bottom: 0.5rem; }
      .menu-item-serves { color: var(--color-gray); margin-bottom: 1rem; }
      .menu-item-price { margin-top: auto; }
      .price-value { color: var(--color-gold); font-weight: 700; font-size: 1.5rem; }
      .cart-toggle {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 60px;
        height: 60px;
        background: var(--color-gold);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(212,175,55,0.4);
        z-index: 100;
      }
      .cart-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #E63946;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
      }
    </style>
    <section class="hero">
      <div class="container">
        <h1 class="hero-title"><span class="gold-text">Império</span> Pizzas</h1>
        <p class="hero-subtitle">Pizzas artesanais de alta qualidade</p>
        <button class="btn btn-primary" onclick="document.getElementById('menu').scrollIntoView({behavior:'smooth'})">Ver Cardápio</button>
      </div>
    </section>
    <section id="menu" class="menu-section">
      <div class="container">
        <h2 class="section-title">Nosso Cardápio</h2>
        <div class="menu-grid">${productsHTML}</div>
      </div>
    </section>
    <a href="/checkout" class="cart-toggle" id="cartBtn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge" id="cartCount" style="display:none">0</span>
    </a>
    <script>
      function updateCart() {
        const cart = JSON.parse(localStorage.getItem('imperio_cart') || '{"items":[],"itemCount":0}');
        const badge = document.getElementById('cartCount');
        if (cart.itemCount > 0) {
          badge.textContent = cart.itemCount;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
      updateCart();
      window.addEventListener('storage', updateCart);
    </script>
  `);
}

function getProductHTML(product, sizes, flavors, addons) {
  const sizesHTML = sizes.map(s => `
    <button class="option-button" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}">
      <span>${s.name}</span><span>R$ ${s.price.toFixed(2)}</span>
    </button>
  `).join('');

  const flavorsHTML = flavors.map(f => `
    <button class="option-button" data-id="${f.id}" data-name="${f.name}" data-price="${f.extra_price}">
      <span>${f.name}</span>${f.extra_price > 0 ? `<span>+R$ ${f.extra_price.toFixed(2)}</span>` : ''}
    </button>
  `).join('');

  const addonsHTML = addons.map(a => `
    <label class="addon-checkbox">
      <input type="checkbox" data-id="${a.id}" data-name="${a.name}" data-price="${a.price}">
      <span>${a.name}</span><span>+R$ ${a.price.toFixed(2)}</span>
    </label>
  `).join('');

  return getBaseHTML(product.name, `
    <style>
      .product-page { padding: 4rem 0; }
      .back-link { display: inline-block; margin-bottom: 2rem; color: var(--color-gold); font-weight: 600; }
      .product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
      .product-image { width: 100%; border-radius: 1rem; }
      .product-title { font-size: 2.5rem; margin-bottom: 1rem; }
      .product-description { font-size: 1.1rem; color: var(--color-gray); margin-bottom: 1.5rem; }
      .option-group { margin: 2rem 0; }
      .option-group label { display: block; font-weight: 600; margin-bottom: 1rem; }
      .options-list { display: flex; flex-direction: column; gap: 0.75rem; }
      .option-button {
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background: white;
        border: 2px solid var(--color-gray-light);
        border-radius: 0.5rem;
        width: 100%;
        transition: var(--transition);
      }
      .option-button:hover, .option-button.active {
        border-color: var(--color-gold);
        background: var(--color-gold-light);
      }
      .addon-checkbox {
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border: 2px solid var(--color-gray-light);
        border-radius: 0.5rem;
        cursor: pointer;
      }
      .addon-checkbox:has(input:checked) {
        border-color: var(--color-gold);
        background: var(--color-gold-light);
      }
      .quantity-control { margin: 2rem 0; }
      .quantity-buttons { display: flex; align-items: center; gap: 1.5rem; }
      .quantity-buttons button {
        width: 40px;
        height: 40px;
        background: var(--color-gold);
        color: white;
        border-radius: 0.5rem;
        font-size: 1.5rem;
      }
      .product-price {
        display: flex;
        justify-content: space-between;
        padding: 1.5rem 0;
        border-top: 2px solid var(--color-gray-light);
        font-size: 1.5rem;
        font-weight: 700;
      }
      .add-to-cart { width: 100%; font-size: 1.1rem; padding: 1.25rem; }
      @media (max-width: 968px) {
        .product-layout { grid-template-columns: 1fr; }
      }
    </style>
    <main class="product-page">
      <div class="container">
        <a href="/" class="back-link">← Voltar</a>
        <div class="product-layout">
          <div>${product.image_url ? `<img src="${product.image_url}" class="product-image" alt="${product.name}">` : ''}</div>
          <div>
            <h1 class="product-title">${product.name}</h1>
            ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
            <div class="option-group">
              <label>Tamanho</label>
              <div class="options-list" id="sizes">${sizesHTML}</div>
            </div>
            ${flavors.length > 0 ? `
              <div class="option-group">
                <label>Sabor</label>
                <div class="options-list" id="flavors">${flavorsHTML}</div>
              </div>
            ` : ''}
            ${addons.length > 0 ? `
              <div class="option-group">
                <label>Adicionais</label>
                <div class="options-list" id="addons">${addonsHTML}</div>
              </div>
            ` : ''}
            <div class="quantity-control">
              <label>Quantidade</label>
              <div class="quantity-buttons">
                <button id="decrease">-</button>
                <span id="quantity">1</span>
                <button id="increase">+</button>
              </div>
            </div>
            <div class="product-price">
              <span>Total</span>
              <span id="totalPrice">R$ ${product.base_price.toFixed(2)}</span>
            </div>
            <button class="btn btn-primary add-to-cart" id="addToCart">Adicionar ao Carrinho</button>
          </div>
        </div>
      </div>
    </main>
    <script>
      ${getProductScript(product)}
    </script>
  `);
}

function getProductScript(product) {
  return `
    let quantity = 1;
    let selectedSize = null;
    let selectedFlavor = null;
    let selectedAddons = [];

    const sizeButtons = document.querySelectorAll('#sizes .option-button');
    if (sizeButtons.length > 0) {
      const first = sizeButtons[0];
      selectedSize = {
        id: first.dataset.id,
        name: first.dataset.name,
        price: parseFloat(first.dataset.price)
      };
      first.classList.add('active');
    }

    const flavorButtons = document.querySelectorAll('#flavors .option-button');
    if (flavorButtons.length > 0) {
      const first = flavorButtons[0];
      selectedFlavor = {
        id: first.dataset.id,
        name: first.dataset.name,
        extraPrice: parseFloat(first.dataset.price)
      };
      first.classList.add('active');
    }

    function calculatePrice() {
      let price = ${product.base_price};
      if (selectedSize) price = selectedSize.price;
      if (selectedFlavor) price += selectedFlavor.extraPrice;
      selectedAddons.forEach(a => price += a.price);
      return price * quantity;
    }

    function updatePrice() {
      document.getElementById('totalPrice').textContent = 'R$ ' + calculatePrice().toFixed(2);
    }

    document.getElementById('increase').onclick = () => {
      quantity++;
      document.getElementById('quantity').textContent = quantity;
      updatePrice();
    };

    document.getElementById('decrease').onclick = () => {
      if (quantity > 1) {
        quantity--;
        document.getElementById('quantity').textContent = quantity;
        updatePrice();
      }
    };

    sizeButtons.forEach(btn => {
      btn.onclick = () => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = {
          id: btn.dataset.id,
          name: btn.dataset.name,
          price: parseFloat(btn.dataset.price)
        };
        updatePrice();
      };
    });

    flavorButtons.forEach(btn => {
      btn.onclick = () => {
        flavorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFlavor = {
          id: btn.dataset.id,
          name: btn.dataset.name,
          extraPrice: parseFloat(btn.dataset.price)
        };
        updatePrice();
      };
    });

    document.querySelectorAll('#addons input').forEach(input => {
      input.onchange = (e) => {
        const addon = {
          id: e.target.dataset.id,
          name: e.target.dataset.name,
          price: parseFloat(e.target.dataset.price)
        };
        if (e.target.checked) {
          selectedAddons.push(addon);
        } else {
          selectedAddons = selectedAddons.filter(a => a.id !== addon.id);
        }
        updatePrice();
      };
    });

    document.getElementById('addToCart').onclick = () => {
      const unitPrice = calculatePrice() / quantity;
      const cartItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        productId: '${product.id}',
        productName: '${product.name}',
        productImage: '${product.image_url || ''}',
        size: selectedSize,
        flavor: selectedFlavor,
        addons: selectedAddons,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: calculatePrice()
      };

      const cart = JSON.parse(localStorage.getItem('imperio_cart') || '{"items":[],"subtotal":0,"itemCount":0}');
      cart.items.push(cartItem);
      cart.subtotal = cart.items.reduce((s, i) => s + i.totalPrice, 0);
      cart.itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
      localStorage.setItem('imperio_cart', JSON.stringify(cart));
      
      alert('Produto adicionado ao carrinho!');
      window.location.href = '/';
    };
  `;
}

function getCheckoutHTML(orderOrigin) {
  return getBaseHTML('Checkout', `
    <style>
      .checkout-page { padding: 4rem 0; min-height: 100vh; }
      .checkout-page h1 { font-size: 2.5rem; margin-bottom: 2rem; text-align: center; }
      .checkout-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 3rem; }
      .form-section { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 2rem; }
      .form-group { margin-bottom: 1.5rem; }
      .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
      .form-group input, .form-group select, .form-group textarea {
        width: 100%;
        padding: 0.875rem;
        border: 2px solid var(--color-gray-light);
        border-radius: 0.5rem;
      }
      .checkout-summary { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); height: fit-content; position: sticky; top: 2rem; }
      .submit-button { width: 100%; font-size: 1.1rem; padding: 1.25rem; }
      .summary-item { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--color-gray-light); }
      .summary-totals { margin-top: 1.5rem; }
      .summary-row { display: flex; justify-content: space-between; padding: 0.75rem 0; }
      .summary-total { border-top: 2px solid var(--color-gray-light); margin-top: 0.5rem; padding-top: 1rem; font-size: 1.25rem; font-weight: 700; }
      @media (max-width: 968px) {
        .checkout-layout { grid-template-columns: 1fr; }
      }
    </style>
    <main class="checkout-page">
      <div class="container">
        <h1>Finalizar Pedido</h1>
        <div class="checkout-layout">
          <div>
            <form id="checkoutForm">
              <div class="form-section">
                <h2>Informações do Cliente</h2>
                <div class="form-group">
                  <label>Nome ${orderOrigin.type === 'external' ? '*' : ''}</label>
                  <input type="text" name="customerName" ${orderOrigin.type === 'external' ? 'required' : ''}>
                </div>
                ${orderOrigin.type === 'external' ? `
                  <div class="form-group">
                    <label>Telefone *</label>
                    <input type="tel" name="customerPhone" required>
                  </div>
                  <div class="form-group">
                    <label>Tipo *</label>
                    <select name="orderType" id="orderType">
                      <option value="pickup">Retirada</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                  <div class="form-group" id="addressGroup" style="display:none">
                    <label>Endereço *</label>
                    <input type="text" name="customerAddress">
                  </div>
                ` : ''}
              </div>
              <div class="form-section">
                <h2>Pagamento</h2>
                <div class="form-group">
                  <label>Forma de Pagamento</label>
                  <select name="paymentMethod">
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                    <option value="PIX">PIX</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Observações</label>
                  <textarea name="notes" rows="4"></textarea>
                </div>
              </div>
              <button type="submit" class="btn btn-primary submit-button">Confirmar Pedido</button>
            </form>
          </div>
          <div class="checkout-summary">
            <h2>Resumo</h2>
            <div id="orderSummary"></div>
          </div>
        </div>
      </div>
    </main>
    <script>
      ${getCheckoutScript(orderOrigin)}
    </script>
  `);
}

function getCheckoutScript(orderOrigin) {
  return `
    const DELIVERY_FEE = 8.00;
    const orderOrigin = ${JSON.stringify(orderOrigin)};

    function renderSummary() {
      const cart = JSON.parse(localStorage.getItem('imperio_cart') || '{"items":[],"subtotal":0}');
      const orderType = document.getElementById('orderType')?.value || 'pickup';
      const deliveryFee = orderOrigin.type === 'external' && orderType === 'delivery' ? DELIVERY_FEE : 0;
      const total = cart.subtotal + deliveryFee;

      const itemsHTML = cart.items.map(item => \`
        <div class="summary-item">
          <div><strong>\${item.productName}</strong><br><small>Qtd: \${item.quantity}</small></div>
          <div>R$ \${item.totalPrice.toFixed(2)}</div>
        </div>
      \`).join('');

      document.getElementById('orderSummary').innerHTML = \`
        \${itemsHTML}
        <div class="summary-totals">
          <div class="summary-row"><span>Subtotal</span><span>R$ \${cart.subtotal.toFixed(2)}</span></div>
          \${deliveryFee > 0 ? \`<div class="summary-row"><span>Taxa de Entrega</span><span>R$ \${deliveryFee.toFixed(2)}</span></div>\` : ''}
          <div class="summary-row summary-total"><span>Total</span><span>R$ \${total.toFixed(2)}</span></div>
        </div>
      \`;
    }

    document.getElementById('orderType')?.addEventListener('change', (e) => {
      document.getElementById('addressGroup').style.display = e.target.value === 'delivery' ? 'block' : 'none';
      renderSummary();
    });

    document.getElementById('checkoutForm').onsubmit = async (e) => {
      e.preventDefault();
      const cart = JSON.parse(localStorage.getItem('imperio_cart') || '{"items":[],"subtotal":0}');
      const form = new FormData(e.target);
      const orderType = form.get('orderType') || 'internal';
      const deliveryFee = orderOrigin.type === 'external' && orderType === 'delivery' ? DELIVERY_FEE : 0;

      const orderData = {
        order_type: orderOrigin.type === 'internal' ? 'internal' : orderType,
        table_id: orderOrigin.tableId || null,
        table_number: orderOrigin.tableNumber || null,
        customer_name: form.get('customerName'),
        customer_phone: form.get('customerPhone'),
        customer_address: form.get('customerAddress'),
        delivery_fee: deliveryFee,
        subtotal: cart.subtotal,
        total: cart.subtotal + deliveryFee,
        payment_method: form.get('paymentMethod'),
        notes: form.get('notes'),
        items: cart.items.map(item => ({
          product_id: item.productId,
          product_name: item.productName,
          size_name: item.size?.name || null,
          flavor_name: item.flavor?.name || null,
          addons: item.addons.length > 0 ? JSON.stringify(item.addons) : null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await res.json();
      localStorage.removeItem('imperio_cart');
      window.location.href = '/pedido/' + result.orderId;
    };

    renderSummary();
  `;
}

function getOrderHTML(order, items) {
  const itemsHTML = items.map(item => {
    let addons = [];
    try { if (item.addons) addons = JSON.parse(item.addons); } catch(e) {}
    return `
      <div class="order-item">
        <div class="item-quantity">${item.quantity}x</div>
        <div class="item-details">
          <strong>${item.product_name}</strong>
          ${item.size_name ? `<span class="item-meta">Tamanho: ${item.size_name}</span>` : ''}
          ${item.flavor_name ? `<span class="item-meta">Sabor: ${item.flavor_name}</span>` : ''}
          ${addons.length > 0 ? `<span class="item-meta">Adicionais: ${addons.map(a => a.name).join(', ')}</span>` : ''}
        </div>
        <div class="item-price">R$ ${item.total_price.toFixed(2)}</div>
      </div>
    `;
  }).join('');

  return getBaseHTML(`Pedido #${order.id.substring(0,8)}`, `
    <style>
      .tracking-page { min-height: 100vh; background: linear-gradient(135deg, var(--color-white) 0%, var(--color-gold-light) 100%); padding: 4rem 0; }
      .tracking-header { text-align: center; margin-bottom: 3rem; }
      .order-id { font-size: 1.25rem; color: var(--color-gray); font-weight: 600; }
      .status-timeline { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 2rem; }
      .timeline-item { display: flex; gap: 1.5rem; padding: 1.5rem; border-left: 4px solid var(--color-gray-light); margin-left: 2rem; opacity: 0.5; }
      .timeline-item.active { opacity: 1; border-left-color: var(--color-gold); background: var(--color-gold-light); border-radius: 0.5rem; }
      .timeline-icon { font-size: 2.5rem; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: var(--color-gray-light); border-radius: 50%; }
      .order-details-card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .order-item { display: flex; gap: 1rem; padding: 1rem; background: var(--color-gray-light); border-radius: 0.5rem; margin-bottom: 1rem; }
      .item-quantity { font-size: 1.25rem; font-weight: 700; color: var(--color-gold); min-width: 40px; }
      .item-details { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
      .item-meta { font-size: 0.9rem; color: var(--color-gray); }
      .item-price { font-size: 1.1rem; font-weight: 700; color: var(--color-gold); }
      .order-totals { margin: 2rem 0; padding: 1.5rem; background: var(--color-gray-light); border-radius: 0.5rem; }
      .total-row { display: flex; justify-content: space-between; padding: 0.5rem 0; }
      .total-grand { border-top: 2px solid var(--color-gold); margin-top: 1rem; padding-top: 1rem; font-size: 1.5rem; font-weight: 700; color: var(--color-gold); }
      .back-btn { width: 100%; margin-top: 1rem; }
    </style>
    <div class="tracking-page">
      <div class="container">
        <div class="tracking-header">
          <h1>🍕 Acompanhe seu Pedido</h1>
          <p class="order-id">Pedido #${order.id.substring(0,8).toUpperCase()}</p>
        </div>
        <div class="status-timeline">
          <div class="timeline-item ${order.status === 'pending' ? 'active' : ''}">
            <div class="timeline-icon">⏳</div>
            <div><h3>Pedido Recebido</h3><p>Seu pedido foi confirmado</p></div>
          </div>
          <div class="timeline-item ${order.status === 'preparing' ? 'active' : ''}">
            <div class="timeline-icon">👨‍🍳</div>
            <div><h3>Em Preparo</h3><p>Estamos preparando seu pedido</p></div>
          </div>
          <div class="timeline-item ${order.status === 'ready' ? 'active' : ''}">
            <div class="timeline-icon">✅</div>
            <div><h3>Pronto</h3><p>Seu pedido está pronto!</p></div>
          </div>
          <div class="timeline-item ${order.status === 'delivered' ? 'active' : ''}">
            <div class="timeline-icon">✔️</div>
            <div><h3>Entregue</h3><p>Pedido entregue com sucesso</p></div>
          </div>
        </div>
        <div class="order-details-card">
          <h2>Detalhes do Pedido</h2>
          ${itemsHTML}
          <div class="order-totals">
            <div class="total-row"><span>Subtotal</span><span>R$ ${order.subtotal.toFixed(2)}</span></div>
            ${order.delivery_fee > 0 ? `<div class="total-row"><span>Taxa de Entrega</span><span>R$ ${order.delivery_fee.toFixed(2)}</span></div>` : ''}
            <div class="total-row total-grand"><span>Total</span><span>R$ ${order.total.toFixed(2)}</span></div>
          </div>
          <a href="/" class="btn btn-primary back-btn">🏠 Voltar ao Início</a>
        </div>
      </div>
    </div>
    <script>setInterval(() => location.reload(), 30000);</script>
  `);
}

function getAdminHTML(orders, tables) {
  const pending = orders.filter(o => o.status === 'pending').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const ready = orders.filter(o => o.status === 'ready').length;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayTimestamp = Math.floor(today.getTime() / 1000);
  const todayOrders = orders.filter(o => o.created_at >= todayTimestamp);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  const ordersHTML = orders.map(order => {
    const itemsHTML = order.items.map(item => {
      let addons = [];
      try { if (item.addons) addons = JSON.parse(item.addons); } catch(e) {}
      return `
        <li>
          <div><strong>${item.quantity}x</strong> ${item.product_name}
          ${item.size_name ? `<small>Tamanho: ${item.size_name}</small>` : ''}
          ${item.flavor_name ? `<small>Sabor: ${item.flavor_name}</small>` : ''}
          </div>
          <span>R$ ${item.total_price.toFixed(2)}</span>
        </li>
      `;
    }).join('');

    return `
      <div class="order-card" data-id="${order.id}">
        <div class="order-header">
          <h3>Pedido #${order.id.substring(0,8).toUpperCase()}</h3>
          <span class="status-badge status-${order.status}">
            ${order.status === 'pending' ? '⏳ Pendente' : 
              order.status === 'preparing' ? '👨‍🍳 Preparando' :
              order.status === 'ready' ? '✅ Pronto' : '✔️ Entregue'}
          </span>
        </div>
        ${order.table_number ? `<p>🏠 Mesa ${order.table_number}</p>` : ''}
        ${order.customer_name ? `<p>👤 ${order.customer_name}</p>` : ''}
        <ul class="order-items">${itemsHTML}</ul>
        <p class="order-total">Total: R$ ${order.total.toFixed(2)}</p>
        <div class="order-actions">
          ${order.status === 'pending' ? `
            <button class="btn-action" onclick="updateStatus('${order.id}', 'preparing')">👨‍🍳 Iniciar Preparo</button>
          ` : ''}
          ${order.status === 'preparing' ? `
            <button class="btn-action" onclick="updateStatus('${order.id}', 'ready')">✅ Marcar Pronto</button>
          ` : ''}
          ${order.status === 'ready' ? `
            <button class="btn-action" onclick="updateStatus('${order.id}', 'delivered')">✔️ Entregar</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return getBaseHTML('Admin', `
    <style>
      .admin-page { min-height: 100vh; background: #F8F9FA; }
      .admin-header { background: white; padding: 1.5rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.08); margin-bottom: 2rem; }
      .header-content { display: flex; justify-content: space-between; align-items: center; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
      .stat-card { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .stat-value { font-size: 2rem; font-weight: 700; color: var(--color-black); }
      .orders-section { margin-top: 2rem; }
      .orders-list { display: flex; flex-direction: column; gap: 1.25rem; }
      .order-card { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-left: 5px solid var(--color-gold); }
      .order-header { display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--color-gray-light); }
      .status-badge { padding: 0.5rem 1rem; border-radius: 2rem; font-weight: 700; font-size: 0.85rem; }
      .status-pending { background: #FFF3CD; color: #856404; }
      .status-preparing { background: #D1ECF1; color: #0C5460; }
      .status-ready { background: #D4EDDA; color: #155724; }
      .status-delivered { background: #D6D8DB; color: #383D41; }
      .order-items { list-style: none; margin: 1rem 0; }
      .order-items li { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(0,0,0,0.1); }
      .order-total { font-size: 1.25rem; font-weight: 700; color: var(--color-gold); margin: 1rem 0; }
      .order-actions { display: flex; gap: 0.75rem; }
      .btn-action { flex: 1; padding: 0.875rem; background: var(--color-gold); color: white; border-radius: 0.5rem; font-weight: 700; }
    </style>
    <div class="admin-page">
      <header class="admin-header">
        <div class="container">
          <div class="header-content">
            <h1>🍕 Painel Administrativo</h1>
            <a href="/" class="btn btn-primary">🏠 Site</a>
          </div>
        </div>
      </header>
      <main class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>⏳ Pendentes</h3>
            <p class="stat-value">${pending}</p>
          </div>
          <div class="stat-card">
            <h3>👨‍🍳 Em Preparo</h3>
            <p class="stat-value">${preparing}</p>
          </div>
          <div class="stat-card">
            <h3>✅ Prontos</h3>
            <p class="stat-value">${ready}</p>
          </div>
          <div class="stat-card">
            <h3>💰 Faturamento Hoje</h3>
            <p class="stat-value">R$ ${todayRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div class="orders-section">
          <h2>📦 Gestão de Pedidos</h2>
          <div class="orders-list">${ordersHTML}</div>
        </div>
      </main>
    </div>
    <script>
      async function updateStatus(orderId, status) {
        if (!confirm('Confirma esta ação?')) return;
        const res = await fetch('/api/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status })
        });
        if (res.ok) location.reload();
      }
      setInterval(() => location.reload(), 60000);
    </script>
  `);
}