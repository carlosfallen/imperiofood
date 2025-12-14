// FILE: src/lib/cart.ts
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  size?: { name: string; price: number };
  flavor?: { name: string; extraPrice: number };
  addons: Array<{ name: string; price: number }>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

const CART_KEY = 'imperio_cart';

export const cartStorage = {
  get(): Cart {
    if (typeof window === 'undefined') return { items: [], subtotal: 0, itemCount: 0 };
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return { items: [], subtotal: 0, itemCount: 0 };
    return JSON.parse(stored);
  },

  set(cart: Cart): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_KEY);
  },

  calculateTotals(items: CartItem[]): Cart {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, subtotal, itemCount };
  }
};