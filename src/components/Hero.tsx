// FILE: src/components/Hero.tsx
import { createSignal, onMount } from 'solid-js';

export default function Hero() {
  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    setTimeout(() => setIsVisible(true), 100);
  });

  const scrollToMenu = () => {
    const menu = document.getElementById('menu');
    if (menu) {
      menu.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section class="hero">
      <style>{`
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-white) 0%, var(--color-gold-light) 100%);
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
          animation: hero-float 20s ease-in-out infinite;
        }

        @keyframes hero-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }

        .hero-content {
          text-align: center;
          z-index: 1;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-content.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-title {
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.1;
        }

        .gold-text {
          color: var(--color-gold);
          display: block;
        }

        .hero-subtitle {
          font-size: clamp(1.25rem, 3vw, 2rem);
          color: var(--color-gray);
          margin-bottom: 1.5rem;
          font-weight: 300;
        }

        .hero-description {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--color-gray);
          max-width: 600px;
          margin: 0 auto 3rem;
          line-height: 1.8;
        }

        .scroll-indicator {
          margin-top: 4rem;
          color: var(--color-gold);
          cursor: pointer;
          animation: hero-bounce 2s infinite;
        }

        @keyframes hero-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .scroll-indicator svg {
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .hero {
            min-height: 80vh;
          }
        }
      `}</style>
      
      <div class="container">
        <div class="hero-content" classList={{ 'visible': isVisible() }}>
          <h1 class="hero-title">
            <span class="gold-text">Império</span> Pizzas
          </h1>
          <p class="hero-subtitle">Pizzas artesanais de alta qualidade</p>
          <p class="hero-description">
            Experimente nossas criações exclusivas, feitas com ingredientes premium e muito sabor
          </p>
          <button class="btn btn-primary" onClick={scrollToMenu}>
            Ver Cardápio
          </button>
          <div class="scroll-indicator" onClick={scrollToMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}