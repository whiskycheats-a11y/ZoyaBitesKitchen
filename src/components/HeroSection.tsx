import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, UtensilsCrossed, Clock, Truck } from 'lucide-react';
import heroImage from '@/assets/hero-food.jpg';
import { useMouseParallax, useScrollReveal, useCountUp } from '@/hooks/useAnimations';

const HeroSection = () => {
  const navigate = useNavigate();
  const mouse = useMouseParallax(0.01);
  const { setRef: statsRef, isVisible: statsVisible } = useScrollReveal();
  const dishCount = useCountUp(50, 1500, statsVisible);
  const deliveryTime = useCountUp(30, 1200, statsVisible);

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background image with subtle parallax */}
      <motion.div
        className="absolute inset-0"
        style={{ x: mouse.x * -1, y: mouse.y * -1 }}
      >
        <img src={heroImage} alt="Delicious food spread" className="w-full h-full object-cover scale-[1.03]" />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

      <div className="container mx-auto px-5 sm:px-6 relative z-10 pt-24 sm:pt-28 pb-12">
        <div className="max-w-2xl">
          {/* Subtle label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-primary/80 text-xs font-medium uppercase tracking-[0.25em] mb-6 sm:mb-8 block">
              <span className="w-8 h-px bg-primary/40" />
              Fresh & Authentic
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-display text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5 md:mb-7"
          >
            <span className="text-foreground">Taste the</span>
            <br />
            <span className="text-gradient-gold">Authentic</span>
            <br />
            <span className="text-foreground">Flavors</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-accent text-base sm:text-lg md:text-xl text-foreground/45 mb-8 md:mb-10 max-w-lg leading-relaxed italic"
          >
            From our kitchen to your table — handcrafted dishes made with love, delivered fresh to your doorstep.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-3 sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/menu')}
              className="btn-premium px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2"
            >
              <span>Order Now</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/menu')}
              className="btn-outline-glow px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base"
            >
              View Menu
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            ref={(el) => { if (el) statsRef(el); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-wrap gap-8 sm:gap-12 mt-12 md:mt-16 pt-8 border-t border-foreground/[0.06]"
          >
            {[
              { icon: UtensilsCrossed, value: `${dishCount}+`, label: 'Dishes' },
              { icon: Clock, value: `${deliveryTime} min`, label: 'Delivery' },
              { icon: Truck, value: 'Free', label: 'Delivery Fee' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-foreground/[0.04] border border-foreground/[0.06] flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary/70" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">{stat.value}</p>
                  <p className="text-foreground/35 text-xs">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
