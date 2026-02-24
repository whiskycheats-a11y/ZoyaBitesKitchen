import FoodCard from '@/components/FoodCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingParticles from '@/components/FloatingParticles';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Category = {
  _id: string;
  name: string;
  sort_order?: number;
};

type FoodItem = {
  _id: string;
  category_id: string | null;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_veg?: boolean;
  is_available?: boolean;
  sort_order?: number;
};

const MenuPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/menu`);
        const data = await res.json();
        if (!res.ok) {
          console.error('Menu load error', data);
          toast.error(data.error || 'Failed to load menu');
        } else {
          setCategories(data.categories || []);
          setItems(data.items || []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load menu';
        console.error('Menu load exception', err);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = items.filter(i => {
    const matchesCat = !selectedCat || i.category_id === selectedCat;
    const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Group items with (Half)/(Full) variants together
  const groupedItems = (() => {
    const groups: { key: string; items: FoodItem[] }[] = [];
    const used = new Set<string>();

    for (const item of filteredItems) {
      if (used.has(item._id)) continue;
      const baseName = item.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim();

      const variants = filteredItems.filter(i =>
        i.category_id === item.category_id &&
        i.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim() === baseName &&
        (i.name.includes('(Half)') || i.name.includes('(Full)'))
      );

      if (variants.length > 1) {
        variants.forEach(v => used.add(v._id));
        variants.sort((a, b) => (a.name.includes('(Half)') ? -1 : 1));
        groups.push({ key: baseName + item.category_id, items: variants });
      } else {
        used.add(item._id);
        groups.push({ key: item._id, items: [item] });
      }
    }
    return groups;
  })();

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <FloatingParticles count={10} />

      <main className="pt-28 pb-16 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-primary text-sm font-medium uppercase tracking-[0.2em] mb-3 block">Curated for you</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-3">
              Our <span className="text-gradient-gold">Menu</span>
            </h1>
            <div className="divider-ornament max-w-xs mx-auto mb-8">
              <Sparkles className="w-4 h-4 text-primary/40" />
            </div>
          </motion.div>

          {/* Search + Filters */}
          <div className="mb-10 space-y-5">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="pl-11 bg-card border-border/50 rounded-xl h-12 focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
              <button
                onClick={() => setSelectedCat(null)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${!selectedCat ? 'btn-premium' : 'bg-muted/50 text-muted-foreground border border-border'}`}
              >
                All Dishes
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCat(cat._id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCat === cat._id ? 'btn-premium' : 'bg-muted/50 text-muted-foreground border border-border'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading deliciousness...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-7xl mb-6 block">🍽️</span>
              <p className="text-foreground/60 text-xl font-display mb-2">Nothing here yet!</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCat || 'all'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {groupedItems.map((group, i) => (
                  <FoodCard
                    key={group.key}
                    item={group.items[0]}
                    variants={group.items.length > 1 ? group.items : undefined}
                    index={i}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MenuPage;
