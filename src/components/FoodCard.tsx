import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Circle, Plus, Minus, UtensilsCrossed } from 'lucide-react';
import { useCart, type FoodItem } from '@/contexts/CartContext';

export interface FoodCardProps {
  item: FoodItem;
  variants?: FoodItem[];
  index?: number;
}

const FoodCard = ({ item, variants, index = 0 }: FoodCardProps) => {
  const { items, addItem, updateQuantity } = useCart();

  const hasVariants = variants && variants.length > 1;
  const [selectedVariantId, setSelectedVariantId] = useState(
    hasVariants ? (variants.find(v => v.name.includes('(Half)'))?._id || variants[0]._id) : item._id
  );

  const activeItem = hasVariants ? variants.find(v => v._id === selectedVariantId)! : item;
  const cartItem = items.find(i => i.food._id === activeItem._id);

  const displayName = hasVariants
    ? activeItem.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim()
    : activeItem.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col rounded-xl bg-card border border-border hover:border-primary/15 transition-all duration-500 overflow-hidden hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.12)]"
    >
      {/* Image */}
      <div className="relative h-40 sm:h-44 overflow-hidden flex-shrink-0">
        {activeItem.image_url ? (
          <img
            src={activeItem.image_url}
            alt={activeItem.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-50" />

        {/* Veg/Non-veg tag */}
        <div className="absolute top-2.5 left-2.5">
          {activeItem.is_veg ? (
            <span className="tag-veg">
              <Leaf className="w-3 h-3" /> Veg
            </span>
          ) : (
            <span className="tag-nonveg">
              <Circle className="w-3 h-3" /> Non-Veg
            </span>
          )}
        </div>

        {!activeItem.is_available && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-foreground/50 font-display font-semibold text-sm tracking-wide uppercase">Unavailable</span>
          </div>
        )}

        {/* Price */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="bg-background/70 backdrop-blur-md text-primary font-bold text-sm px-2.5 py-1 rounded-lg border border-primary/15">
            ₹{activeItem.price}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-sm sm:text-base text-card-foreground leading-tight">{displayName}</h3>
        {activeItem.description && (
          <p className="text-muted-foreground text-xs mt-1 line-clamp-2 leading-relaxed">{activeItem.description}</p>
        )}

        <div className="flex-1 min-h-2" />

        {/* Variant selector */}
        {hasVariants && (
          <div className="mt-3 flex gap-1.5">
            {variants.map(v => {
              const label = v.name.includes('(Half)') ? 'Half' : v.name.includes('(Full)') ? 'Full' : v.name;
              const isActive = v._id === selectedVariantId;
              return (
                <button
                  key={v._id}
                  onClick={() => setSelectedVariantId(v._id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all border ${isActive
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted/20 border-border text-muted-foreground hover:border-primary/15'
                    }`}
                >
                  {label} · ₹{v.price}
                </button>
              );
            })}
          </div>
        )}

        {/* Cart actions */}
        <div className="mt-3">
          {activeItem.is_available !== false && (
            cartItem ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">In cart</span>
                <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateQuantity(activeItem._id!, cartItem.quantity - 1)}
                    className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:border-primary/20 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <span className="font-semibold w-7 text-center text-sm">{cartItem.quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateQuantity(activeItem._id!, cartItem.quantity + 1)}
                    className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:border-primary/20 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => addItem(activeItem)}
                className="w-full btn-premium py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FoodCard;
