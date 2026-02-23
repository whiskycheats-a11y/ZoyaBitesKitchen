import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-background border-t border-border/50">
      <div className="container mx-auto px-5 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold text-foreground">
                Zoya<span className="text-gradient-gold">Bites</span>
              </span>
            </Link>
            <p className="text-foreground/30 text-sm leading-relaxed max-w-sm font-accent italic text-base">
              "Where every dish tells a story of tradition, passion, and the finest flavors."
            </p>
            <div className="flex gap-2.5 mt-5">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/zoya.bites?igsh=MTdnbnprM2JpM3lkdg==' },
                { icon: Phone, href: 'tel:9454950104' },
                { icon: Mail, href: 'mailto:zoyabites@gmail.com' },
              ].map(({ icon: Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  whileHover={{ y: -2 }}
                  className="w-9 h-9 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center text-foreground/30 hover:text-primary hover:border-primary/25 transition-all duration-300"
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70 mb-5">Navigate</h4>
            <div className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/menu', label: 'Menu' },
                { to: '/cart', label: 'Cart' },
                { to: '/orders', label: 'My Orders' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-foreground/30 hover:text-primary text-sm transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70 mb-5">Contact</h4>
            <div className="space-y-3.5">
              {[
                { icon: Phone, text: '9454950104' },
                { icon: Mail, text: 'zoyabites@gmail.com' },
                { icon: MapPin, text: 'Zoyalegal Services, 57, Guru Govind Singh Marg, Maqbool Ganj, Lalkuan, Lucknow, Uttar Pradesh 226001' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-foreground/30 text-sm">
                  <Icon className="w-3.5 h-3.5 text-primary/40 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-foreground/20 text-xs">
            © {new Date().getFullYear()} ZoyaBites. All rights reserved.
          </p>
          <p className="text-foreground/15 text-xs tracking-wider">
            Taste · Quality · Tradition
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
