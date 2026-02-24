import { supabase } from '@/integrations/supabase/client';
import FoodCard from '@/components/FoodCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingParticles from '@/components/FloatingParticles';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
  sortOrder?: number;
};

type FoodItem = {
  id: string;
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
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: categoriesData, error: catError } = await supabase
          .from('menu_categories')
          .select('*')
          .order('sort_order');

        const { data: itemsData, error: itemsError } = await supabase
          .from('food_items')
          .select('*')
          .order('sort_order');

        if (catError || itemsError) {
          console.error('Menu load error', catError || itemsError);
          toast.error('Failed to load menu');
        } else {
          setCategories(categoriesData || []);
          setItems(itemsData || []);
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
      if (used.has(item.id)) continue;
      const baseName = item.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim();
      // Find matching variant in filtered items
      const variants = filteredItems.filter(i =>
        i.category_id === item.category_id &&
        i.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim() === baseName &&
        (i.name.includes('(Half)') || i.name.includes('(Full)'))
      );
      if (variants.length > 1) {
        variants.forEach(v => used.add(v.id));
        // Sort: Half first
        variants.sort((a, b) => (a.name.includes('(Half)') ? -1 : 1));
        groups.push({ key: baseName + item.category_id, items: variants });
      } else {
        used.add(item.id);
        groups.push({ key: item.id, items: [item] });
      }
    }
    return groups;
  })();

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <FloatingParticles count={10} />

      {/* Header */}
      <div className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-section" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-primary text-sm font-medium uppercase tracking-[0.2em] mb-3 block">Curated for you</span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3">
              Our <span className="text-gradient-gold">Menu</span>
            </h1>
            <div className="divider-ornament max-w-xs mx-auto mb-8">
              <Sparkles className="w-4 h-4 text-primary/40" />
            </div>
            <p className="text-muted-foreground max-w-md mx-auto font-accent italic text-lg">
              Each dish is a masterpiece — crafted with the finest ingredients and generations of culinary wisdom
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 relative z-10">
        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10 space-y-5"
        >
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="pl-11 bg-card border-border/50 rounded-xl h-12 focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCat(null)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${!selectedCat
                  ? 'btn-premium'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/20'
                }`}
            >
              <span className="relative z-10">All Dishes</span>
            </motion.button>
            {categories.map(cat => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCat(cat.id)}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${selectedCat === cat.id
                    ? 'btn-premium'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/20'
                  }`}
              >
                <span className="relative z-10">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Items grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-primary/20" />
            </div>
            <p className="text-muted-foreground text-sm">Loading deliciousness...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <span className="text-7xl mb-6 block">🍽️</span>
            <p className="text-foreground/60 text-xl font-display mb-2">Nothing here yet!</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Try a different search term' : 'Check back soon for delicious new items'}
            </p>
          </motion.div>
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
      <Footer />
    </div>
  );
};

export default MenuPage;
