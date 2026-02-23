import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, MapPin, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, isAdmin, isSeller, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/about', label: 'About' },
    ...(user ? [{ to: '/orders', label: 'My Orders' }] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm shadow-black/10'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0.5">
          <span className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">Zoya</span>
          <span className="font-display text-xl sm:text-2xl font-bold text-gradient-gold tracking-tight">Bites</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link text-[13px] font-medium transition-colors duration-300 ${pathname === link.to
                ? 'text-primary'
                : 'text-foreground/50 hover:text-foreground'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cart')}
            className="relative p-2.5 rounded-lg hover:bg-muted/40 transition-colors duration-300"
          >
            <ShoppingCart className="w-[18px] h-[18px] text-foreground/60" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-secondary text-secondary-foreground text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] min-h-[18px]"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {user ? (
            <div className="hidden md:block">
              <ProfileDropdown />
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/auth')}
              className="hidden md:flex btn-premium rounded-lg px-4 h-8 text-xs"
            >
              <User className="w-3.5 h-3.5 mr-1.5" /> Login
            </Button>
          )}

          <button className="md:hidden p-2 rounded-lg hover:bg-muted/40 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border/50"
          >
            <div className="px-5 py-4 space-y-0.5">
              {navLinks.map((link, i) => (
                <motion.div key={link.to} initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <Link to={link.to} onClick={() => setMobileOpen(false)} className="flex items-center text-sm font-medium py-3 px-3 rounded-lg hover:bg-muted/30 transition-colors text-foreground/70">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {user && (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 text-sm font-medium py-3 px-3 rounded-lg hover:bg-muted/30 text-foreground/70">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> My Profile
                  </Link>
                  {(isAdmin || isSeller) && (
                    <Link to="/admin1122" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 text-sm font-medium py-3 px-3 rounded-lg hover:bg-muted/30 text-secondary">
                      <Settings className="w-4 h-4" /> {isAdmin ? 'Admin Panel' : 'Seller Panel'}
                    </Link>
                  )}
                </>
              )}
              <div className="pt-2 mt-2 border-t border-border/50">
                {user ? (
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-2.5 w-full text-left text-sm font-medium py-3 px-3 rounded-lg text-destructive hover:bg-destructive/5">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 text-sm font-medium py-3 px-3 rounded-lg text-primary">
                    <User className="w-4 h-4" /> Login / Sign Up
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
