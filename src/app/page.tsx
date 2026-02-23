'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Truck, ChefHat, Sparkles, Flame, UtensilsCrossed, Cookie, Beef } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';

export default function Home() {
    const router = useRouter();

    const features = [
        { icon: ChefHat, title: 'Master Chefs', desc: 'Expert hands crafting each dish with decades of culinary tradition and passion' },
        { icon: Shield, title: 'Pure & Hygienic', desc: 'FSSAI certified kitchen with the highest standards of cleanliness and safety' },
        { icon: Truck, title: 'Lightning Fast', desc: 'Piping hot food at your doorstep within 30 minutes or less, guaranteed' },
    ];

    const specialties = [
        { icon: UtensilsCrossed, name: 'Biryani', desc: 'Royal & Aromatic' },
        { icon: Flame, name: 'Curries', desc: 'Rich & Flavorful' },
        { icon: Beef, name: 'Kebabs', desc: 'Charcoal Grilled' },
        { icon: Cookie, name: 'Desserts', desc: 'Sweet Traditions' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <HeroSection />

            {/* Specialties */}
            <section className="relative section-padding overflow-hidden">
                <div className="absolute inset-0 bg-gradient-warm" />
                <div className="container mx-auto relative z-10 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <span className="text-primary/70 text-xs font-medium uppercase tracking-[0.25em] mb-3 block">What we offer</span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                            Our <span className="text-gradient-gold">Specialties</span>
                        </h2>
                        <div className="divider-ornament max-w-xs mx-auto mt-5">
                            <Sparkles className="w-3.5 h-3.5 text-primary/30" />
                        </div>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5"
                    >
                        {specialties.map((s) => (
                            <motion.div
                                key={s.name}
                                variants={staggerItem}
                                whileHover={{ y: -6 }}
                                onClick={() => router.push('/menu')}
                                className="group rounded-2xl p-5 sm:p-8 text-center cursor-pointer bg-card/50 border border-border hover:border-primary/20 transition-all duration-500 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.15)]"
                            >
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted/40 border border-border group-hover:border-primary/20 flex items-center justify-center mx-auto mb-4 transition-colors duration-500">
                                    <s.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary/70 group-hover:text-primary transition-colors duration-500" />
                                </div>
                                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-1">{s.name}</h3>
                                <p className="text-muted-foreground text-xs font-accent italic">{s.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="relative section-padding overflow-hidden">
                <div className="absolute inset-0 bg-gradient-section" />
                <div className="container mx-auto relative z-10 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <span className="text-primary/70 text-xs font-medium uppercase tracking-[0.25em] mb-3 block">Why choose us</span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                            The ZoyaBites <span className="text-gradient-fire">Promise</span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12, duration: 0.5 }}
                                className="rounded-2xl p-6 sm:p-8 text-center bg-card/50 border border-border hover:border-primary/15 transition-all duration-500"
                            >
                                <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border flex items-center justify-center mx-auto mb-5">
                                    <f.icon className="w-6 h-6 text-primary/70" />
                                </div>
                                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative section-padding overflow-hidden">
                <div className="absolute inset-0 bg-gradient-hero" />
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[120px]" />

                <div className="container mx-auto max-w-2xl text-center relative z-10 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-6">
                            <UtensilsCrossed className="w-7 h-7 text-primary/70" />
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                            Hungry? <span className="text-gradient-gold">Order Now!</span>
                        </h2>
                        <p className="text-foreground/35 mb-8 md:mb-10 max-w-md mx-auto font-accent italic text-base sm:text-lg">
                            Discover our handcrafted menu — from aromatic biryanis to sizzling kebabs, every bite is a journey.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/menu')}
                            className="btn-premium px-8 sm:px-10 py-3.5 rounded-xl text-base sm:text-lg inline-flex items-center gap-2.5"
                        >
                            <span>Explore Menu</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
