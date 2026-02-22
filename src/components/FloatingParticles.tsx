import { useEffect, useRef } from 'react';

const FloatingParticles = ({ count = 20 }: { count?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const delay = Math.random() * 15;
      const duration = Math.random() * 15 + 15;
      const left = Math.random() * 100;
      const isGold = Math.random() > 0.3;

      Object.assign(particle.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        left: `${left}%`,
        bottom: '-10px',
        background: isGold
          ? `radial-gradient(circle, hsl(38 75% 55% / 0.4), hsl(38 75% 55% / 0.05))`
          : `radial-gradient(circle, hsl(0 60% 42% / 0.3), hsl(0 60% 42% / 0.05))`,
        animation: `float-particle ${duration}s ${delay}s linear infinite`,
        pointerEvents: 'none',
      });

      container.appendChild(particle);
    }

    return () => { container.innerHTML = ''; };
  }, [count]);

  return <div ref={containerRef} className="particles-container" />;
};

export default FloatingParticles;
