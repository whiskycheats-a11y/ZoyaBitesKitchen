import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence>
                {items.map(({ food, quantity }) => (
                  <motion.div
                    key={food.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-card rounded-xl p-4 border border-border/50"
                  >
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden shrink-0">
                      {food.image_url ? (
                        <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-card-foreground truncate">{food.name}</h3>
                      <p className="text-primary font-bold">₹{food.price}</p>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(food.id, quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-bold w-6 text-center">{quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(food.id, quantity + 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-foreground">₹{(food.price * quantity).toFixed(2)}</p>
                        <button onClick={() => removeItem(food.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="mt-8 bg-card rounded-xl p-6 border border-border/50">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-bold text-green-600">Free</span>
              </div>
              <div className="border-t border-border mt-4 pt-4 flex justify-between">
                <span className="font-display text-xl font-bold">Total</span>
                <span className="font-display text-xl font-bold text-primary">₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={clearCart} className="flex-1">Clear Cart</Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!user) {
                      navigate('/auth?redirect=checkout');
                    } else {
                      navigate('/checkout');
                    }
                  }}
                >
                  Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
