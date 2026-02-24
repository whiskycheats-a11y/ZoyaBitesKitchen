import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FoodItem {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  image_url?: string | null;
  description?: string | null;
  is_veg?: boolean;
  is_available?: boolean;
  category_id?: string | null;
  sort_order?: number;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (food: FoodItem) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((food: FoodItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.food._id === food._id);
      if (existing) {
        return prev.map(i => i.food._id === food._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { food, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((foodId: string) => {
    setItems(prev => prev.filter(i => i.food._id !== foodId));
  }, []);

  const updateQuantity = useCallback((foodId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.food._id !== foodId));
    } else {
      setItems(prev => prev.map(i => i.food._id === foodId ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.food.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
