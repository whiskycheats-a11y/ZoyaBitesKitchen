import { useEffect, useState } from 'react';

/** Custom hook for scroll-triggered reveal animations */
export const useScrollReveal = (threshold = 0.15) => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { setRef, isVisible };
};

/** Custom hook for smooth counter animation */
export const useCountUp = (target: number, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
};

/** Custom hook for parallax on mouse move — throttled to 60fps via rAF */
export const useMouseParallax = (intensity = 0.02) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let rafId: number;
    let latestX = 0, latestY = 0;

    const handleMouse = (e: MouseEvent) => {
      latestX = (e.clientX - window.innerWidth / 2) * intensity;
      latestY = (e.clientY - window.innerHeight / 2) * intensity;
    };

    const update = () => {
      setPosition({ x: latestX, y: latestY });
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafId);
    };
  }, [intensity]);

  return position;
};

/** Stagger animation helper for children */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};
