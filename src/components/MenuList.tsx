// FILE: src/components/MenuList.tsx
import { For, Show } from 'solid-js';

interface Product {
  id: string;
  name: string;
  slug: string;
  serves_people: number;
  base_price: number;
  image_url?: string;
}

interface Props {
  initialProducts: Product[];
}

export default function MenuList(props: Props) {
  return (
    <section id="menu" class="menu-section">
      <style>{`
        .menu-section {
          padding: 6rem 0;
          background: var(--color-white);
        }

        .section-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          text-align: center;
          margin-bottom: 4rem;
          color: var(--color-black);
        }

        .section-title::after {
          content: '';
          display: block;
          width: 100px;
          height: 4px;
          background: var(--color-gold);
          margin: 1.5rem auto 0;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .menu-item {
          background: var(--color-white);
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: var(--transition);
          display: flex;
          flex-direction: column;
        }

        .menu-item:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(212, 175, 55, 0.2);
        }

        .menu-item-image {
          width: 100%;
          height: 250px;
          overflow: hidden;
          background: var(--color-gray-light);
        }

        .menu-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition);
        }

        .menu-item:hover .menu-item-image img {
          transform: scale(1.05);
        }

        .menu-item-content {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .menu-item-name {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-black);
        }

        .menu-item-serves {
          color: var(--color-gray);
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }

        .menu-item-price {
          margin-top: auto;
          font-size: 1.1rem;
          color: var(--color-gray);
        }

        .price-value {
          color: var(--color-gold);
          font-weight: 700;
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .menu-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div class="container">
        <h2 class="section-title">Nosso Cardápio</h2>

        <div class="menu-grid">
          <For each={props.initialProducts}>
            {(product) => (
              <a href={`/produto/${product.slug}`} class="menu-item">
                <Show when={product.image_url}>
                  <div class="menu-item-image">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      loading="lazy"
                    />
                  </div>
                </Show>
                <div class="menu-item-content">
                  <h3 class="menu-item-name">{product.name}</h3>
                  <p class="menu-item-serves">
                    Serve {product.serves_people} {product.serves_people === 1 ? 'pessoa' : 'pessoas'}
                  </p>
                  <p class="menu-item-price">
                    A partir de <span class="price-value">R$ {product.base_price.toFixed(2)}</span>
                  </p>
                </div>
              </a>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}