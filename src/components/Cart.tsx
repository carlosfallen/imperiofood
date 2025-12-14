// FILE: src/components/Cart.tsx
import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { cartStorage, type Cart as CartType } from '../lib/cart';

export default function CartComponent() {
  const [cart, setCart] = createSignal<CartType>({ items: [], subtotal: 0, itemCount: 0 });
  const [isOpen, setIsOpen] = createSignal(false);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setCart(cartStorage.get());
    setMounted(true);
  });

  createEffect(() => {
    if (!mounted()) return;

    const handleStorageChange = () => {
      setCart(cartStorage.get());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleStorageChange);
    };
  });

  const updateQuantity = (itemId: string, delta: number) => {
    const currentCart = cartStorage.get();
    const items = currentCart.items.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        };
      }
      return item;
    });

    const updated = cartStorage.calculateTotals(items);
    cartStorage.set(updated);
    setCart(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (itemId: string) => {
    const currentCart = cartStorage.get();
    const items = currentCart.items.filter(item => item.id !== itemId);
    const updated = cartStorage.calculateTotals(items);
    cartStorage.set(updated);
    setCart(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <>
      <style>{`
        .cart-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          background: var(--color-gold);
          color: var(--color-white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
          z-index: 100;
          transition: var(--transition);
        }

        .cart-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(212, 175, 55, 0.6);
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

        .cart-drawer {
          position: fixed;
          top: 0;
          right: -100%;
          width: 100%;
          max-width: 450px;
          height: 100vh;
          background: var(--color-white);
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 101;
          transition: right 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
        }

        .cart-drawer.open {
          right: 0;
        }

        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          border-bottom: 1px solid var(--color-gray-light);
        }

        .cart-header h2 {
          font-size: 1.5rem;
          color: var(--color-black);
        }

        .cart-close {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-gray);
          transition: var(--transition);
        }

        .cart-close:hover {
          color: var(--color-black);
        }

        .cart-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .cart-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-gray);
        }

        .cart-item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--color-gray-light);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          position: relative;
        }

        .cart-item-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 0.5rem;
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-details h3 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .cart-item-option {
          font-size: 0.9rem;
          color: var(--color-gray);
          margin: 0.25rem 0;
        }

        .cart-item-quantity {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1rem 0;
        }

        .cart-item-quantity button {
          width: 30px;
          height: 30px;
          background: var(--color-white);
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: var(--color-gold);
          transition: var(--transition);
        }

        .cart-item-quantity button:hover {
          background: var(--color-gold);
          color: var(--color-white);
        }

        .cart-item-price {
          font-weight: 700;
          color: var(--color-gold);
          font-size: 1.1rem;
        }

        .cart-item-remove {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-gray);
          transition: var(--transition);
        }

        .cart-item-remove:hover {
          color: #E63946;
        }

        .cart-footer {
          padding: 2rem;
          border-top: 1px solid var(--color-gray-light);
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
        }

        .cart-total-value {
          font-weight: 700;
          color: var(--color-gold);
          font-size: 1.5rem;
        }

        .cart-checkout {
          width: 100%;
        }

        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        @media (max-width: 768px) {
          .cart-drawer {
            max-width: 100%;
          }
        }
      `}</style>

      <button 
        class="cart-toggle" 
        onClick={() => setIsOpen(!isOpen())}
        aria-label="Carrinho"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        {mounted() && cart().itemCount > 0 && (
          <span class="cart-badge">{cart().itemCount}</span>
        )}
      </button>

      <div class="cart-drawer" classList={{ 'open': isOpen() }}>
        <div class="cart-header">
          <h2>Carrinho</h2>
          <button class="cart-close" onClick={() => setIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="cart-content">
          <Show when={cart().items.length === 0}>
            <div class="cart-empty">
              <p>Seu carrinho está vazio</p>
            </div>
          </Show>

          <For each={cart().items}>
            {(item) => (
              <div class="cart-item">
                <Show when={item.productImage}>
                  <img src={item.productImage} alt={item.productName} class="cart-item-image" />
                </Show>
                <div class="cart-item-details">
                  <h3>{item.productName}</h3>
                  <Show when={item.size}>
                    <p class="cart-item-option">Tamanho: {item.size!.name}</p>
                  </Show>
                  <Show when={item.flavor}>
                    <p class="cart-item-option">Sabor: {item.flavor!.name}</p>
                  </Show>
                  <Show when={item.addons.length > 0}>
                    <p class="cart-item-option">
                      Adicionais: {item.addons.map(a => a.name).join(', ')}
                    </p>
                  </Show>
                  <div class="cart-item-quantity">
                    <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <p class="cart-item-price">R$ {item.totalPrice.toFixed(2)}</p>
                </div>
                <button class="cart-item-remove" onClick={() => removeItem(item.id)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>

        <Show when={cart().items.length > 0}>
          <div class="cart-footer">
            <div class="cart-total">
              <span>Subtotal</span>
              <span class="cart-total-value">R$ {cart().subtotal.toFixed(2)}</span>
            </div>
            <a href="/checkout" class="btn btn-primary cart-checkout">
              Finalizar Pedido
            </a>
          </div>
        </Show>
      </div>

      <Show when={isOpen()}>
        <div class="cart-overlay" onClick={() => setIsOpen(false)} />
      </Show>
    </>
  );
}