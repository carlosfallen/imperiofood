// FILE: src/components/Video360Player.tsx
import { createSignal, onMount, Show } from 'solid-js';

interface Props {
  videoUrl: string;
  posterUrl?: string;
}

export default function Video360Player(props: Props) {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  let videoRef: HTMLVideoElement | undefined;

  onMount(() => {
    if (videoRef) {
      videoRef.addEventListener('loadeddata', () => {
        setIsLoading(false);
      });
    }
  });

  const togglePlay = () => {
    if (!videoRef) return;
    
    if (isPlaying()) {
      videoRef.pause();
      setIsPlaying(false);
    } else {
      videoRef.play();
      setIsPlaying(true);
    }
  };

  return (
    <div class="video-360-container">
      <style>{`
        .video-360-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          aspect-ratio: 16 / 9;
          border-radius: 1rem;
          overflow: hidden;
          background: var(--color-black);
        }

        .video-360 {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          background: var(--color-black);
          color: var(--color-white);
          z-index: 2;
        }

        .video-controls {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: rgba(212, 175, 55, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-white);
          transition: var(--transition);
          z-index: 1;
        }

        .video-controls:hover {
          background: var(--color-gold);
          transform: translate(-50%, -50%) scale(1.1);
        }

        .video-360-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(212, 175, 55, 0.9);
          color: var(--color-white);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-weight: 600;
          font-size: 0.9rem;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .video-controls {
            width: 60px;
            height: 60px;
          }
          
          .video-controls svg {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      <Show when={isLoading()}>
        <div class="video-loading">
          <div class="loading"></div>
          <p>Carregando vídeo 360°...</p>
        </div>
      </Show>
      
      <video
        ref={videoRef}
        class="video-360"
        poster={props.posterUrl}
        loop
        playsinline
        preload="metadata"
      >
        <source src={props.videoUrl} type="video/mp4" />
        Seu navegador não suporta vídeos.
      </video>

      <button 
        class="video-controls"
        onClick={togglePlay}
        aria-label={isPlaying() ? 'Pausar' : 'Reproduzir'}
      >
        <Show when={!isPlaying()}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </Show>
        <Show when={isPlaying()}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        </Show>
      </button>

      <div class="video-360-badge">360°</div>
    </div>
  );
}