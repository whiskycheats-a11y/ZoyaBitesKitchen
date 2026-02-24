import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Package, Upload, ImageIcon, Users, ShieldCheck, ShieldOff, Lock, ChefHat, ShoppingBag, LayoutGrid, TrendingUp, IndianRupee, Clock, CheckCircle2, Key, Copy, CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';

type Category = {
  _id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
};
type FoodItem = {
  _id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_veg?: boolean;
  is_available?: boolean;
  sort_order?: number;
};
type Order = {
  _id: string;
  userId: string;
  items: any[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  delivery_address?: string;
  notes?: string;
  createdAt: string;
};

const ADMIN_PASSWORD = 'henakhan@@@2050';

const AdminPage = () => {
  const { user, isAdmin, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [passError, setPassError] = useState(false);
  const [tab, setTab] = useState<'categories' | 'items' | 'orders' | 'access'>('items');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCodeUser, setIsCodeUser] = useState(false); // true if logged in via temp code

  // Access codes
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [codeForm, setCodeForm] = useState({ label: '', code: '', hours: '24' });

  // Category form
  const [catForm, setCatForm] = useState({ name: '', description: '', image_url: '' });
  const [editingCat, setEditingCat] = useState<string | null>(null);

  // Item form
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '', is_veg: true, is_available: true });
  const [hasVariants, setHasVariants] = useState(false);
  const [halfPrice, setHalfPrice] = useState('');
  const [fullPrice, setFullPrice] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const data = await api.uploadImage(file);
      toast.success('Photo uploaded!');
      return data.url;
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!adminUnlocked) return;
    setAuthChecked(true);
    // Polling orders instead of Supabase realtime
    const interval = setInterval(fetchOrders, 30000);
    fetchAll();
    return () => clearInterval(interval);
  }, [adminUnlocked]);

  const fetchAll = async () => {
    await Promise.all([fetchCategories(), fetchItems(), fetchOrders()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const data = await api.getCategories();
    if (data && !data.error) setCategories(data);
  };

  const fetchItems = async () => {
    const data = await api.getProducts();
    if (data && !data.error) setItems(data);
  };

  const fetchOrders = async () => {
    const data = await api.getAdminOrders();
    if (data && !data.error) setOrders(data);
  };

  // Category CRUD
  const saveCategory = async () => {
    if (!catForm.name.trim()) { toast.error('Category name required'); return; }
    try {
      await api.saveCategory(editingCat, catForm);
      toast.success(editingCat ? 'Category updated' : 'Category added');
      setCatForm({ name: '', description: '', image_url: '' });
      setEditingCat(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Item CRUD
  const saveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.category_id) {
      toast.error('Name and category are required');
      return;
    }

    try {
      if (hasVariants) {
        if (!halfPrice || !fullPrice) {
          toast.error('Both Half and Full prices are required');
          return;
        }
        const baseName = itemForm.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim();
        const basePayload = { description: itemForm.description, category_id: itemForm.category_id, image_url: itemForm.image_url, is_veg: itemForm.is_veg, is_available: itemForm.is_available };

        // Handling variants sequentially for simplicity
        await api.saveProduct(null, { ...basePayload, name: `${baseName} (Half)`, price: parseFloat(halfPrice) });
        await api.saveProduct(null, { ...basePayload, name: `${baseName} (Full)`, price: parseFloat(fullPrice) });
        toast.success('Item added with Half/Full variants');
      } else {
        if (!itemForm.price) { toast.error('Price is required'); return; }
        const payload = { ...itemForm, price: parseFloat(itemForm.price) };
        await api.saveProduct(editingItem, payload);
        toast.success(editingItem ? 'Item updated' : 'Item added');
      }
      setItemForm({ name: '', description: '', price: '', category_id: '', image_url: '', is_veg: true, is_available: true });
      setHasVariants(false);
      setHalfPrice('');
      setFullPrice('');
      setEditingItem(null);
      setShowItemForm(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.deleteProduct(id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteOrder = async (orderId: string) => {
    // MongoDB Delete logic would go here, omitting for safety if not strictly needed
    toast.info('Delete function not implemented for MongoDB yet');
  };

  const handleAdminLogin = async () => {
    if (adminPass === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setIsCodeUser(false);
      setPassError(false);
      return;
    }
    try {
      const codes = await api.getAccessCodes();
      const validCode = codes.find((c: any) =>
        c.code === adminPass &&
        c.isActive &&
        new Date(c.expiresAt) > new Date()
      );
      if (validCode) {
        setAdminUnlocked(true);
        setIsCodeUser(true);
        setPassError(false);
      } else {
        setPassError(true);
      }
    } catch (err) {
      setPassError(true);
    }
  };

  // Access code CRUD
  const fetchAccessCodes = async () => {
    const data = await api.getAccessCodes();
    if (data && !data.error) setAccessCodes(data);
  };

  const saveAccessCode = async () => {
    if (!codeForm.label.trim() || !codeForm.code.trim()) {
      toast.error('Label and code are required');
      return;
    }
    const hours = parseInt(codeForm.hours) || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    try {
      await api.saveAccessCode({
        label: codeForm.label,
        code: codeForm.code,
        expiresAt,
      });
      toast.success('Access code created!');
      setCodeForm({ label: '', code: '', hours: '24' });
      fetchAccessCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteAccessCode = async (id: string) => {
    try {
      await api.deleteAccessCode(id);
      toast.success('Code deleted');
      fetchAccessCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleCodeActive = async (id: string, active: boolean) => {
    try {
      await api.toggleAccessCode(id, !active);
      fetchAccessCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (tab === 'access') fetchAccessCodes();
  }, [tab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl p-8 sm:p-10 border border-border/50 w-full max-w-sm shadow-2xl shadow-primary/5">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Lock className="w-9 h-9 text-primary" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-center mb-1">Admin Access</h2>
          <p className="text-muted-foreground text-sm text-center mb-8">Enter password to continue</p>
          <Input
            type="password"
            placeholder="Enter admin password"
            value={adminPass}
            onChange={e => { setAdminPass(e.target.value); setPassError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            className={`h-12 rounded-xl bg-muted/30 border-border/50 ${passError ? 'border-destructive' : ''}`}
          />
          {passError && <p className="text-destructive text-xs mt-2">Wrong password</p>}
          <Button className="w-full mt-4 btn-premium h-12 rounded-xl text-base" onClick={handleAdminLogin}>Unlock Dashboard</Button>
        </div>
      </div>
    );
  }

  if (authLoading || !authChecked || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  const stats = [
    { icon: ChefHat, label: 'Menu Items', value: items.length, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { icon: ShoppingBag, label: 'Total Orders', value: orders.length, color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
    { icon: Clock, label: 'Pending', value: pendingOrders, color: 'text-ember', bg: 'bg-ember/10 border-ember/20' },
    { icon: IndianRupee, label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  ];

  const tabConfig = [
    { key: 'items' as const, label: 'Items', icon: ChefHat, count: items.length },
    { key: 'categories' as const, label: 'Categories', icon: LayoutGrid, count: categories.length },
    { key: 'orders' as const, label: 'Orders', icon: ShoppingBag, count: pendingOrders || undefined },
    ...(!isCodeUser ? [{ key: 'access' as const, label: 'Access', icon: Key }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your restaurant</p>
          </div>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-xl p-4 sm:p-5 border border-border/50">
              <div className={`w-10 h-10 rounded-xl ${s.bg} border flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-6 bg-muted/30 p-1.5 rounded-xl border border-border/30 overflow-x-auto">
          {tabConfig.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === t.key
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Categories tab */}
        {tab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                {editingCat ? 'Edit Category' : 'Add Category'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Biryani" className="mt-1 h-11 rounded-xl bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" className="mt-1 h-11 rounded-xl bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Photo</Label>
                  <input ref={catFileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const url = await uploadImage(file); if (url) setCatForm(p => ({ ...p, image_url: url })); }} />
                  <div className="flex gap-2 mt-1">
                    <Button type="button" variant="outline" className="flex-1 gap-2 h-11 rounded-xl" onClick={() => catFileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : catForm.image_url ? 'Change' : 'Upload'}
                    </Button>
                    {catForm.image_url && <img src={catForm.image_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-border" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={saveCategory} className="btn-premium rounded-xl">{editingCat ? 'Update' : 'Add'} Category</Button>
                {editingCat && <Button variant="outline" className="rounded-xl" onClick={() => { setEditingCat(null); setCatForm({ name: '', description: '', image_url: '' }); }}>Cancel</Button>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat._id} className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border/50 hover:border-primary/20 transition-colors">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0"><LayoutGrid className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{cat.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => { setEditingCat(cat._id); setCatForm({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '' }); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => deleteCategory(cat._id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items tab */}
        {tab === 'items' && (
          <div className="space-y-6">
            <Button onClick={() => { setShowItemForm(!showItemForm); setEditingItem(null); }} className={showItemForm ? 'rounded-xl' : 'btn-premium rounded-xl'}>
              {showItemForm ? 'Hide Form' : <><Plus className="w-4 h-4 mr-1.5" /> Add Item</>}
            </Button>
            {showItemForm && (
              <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50">
                <h2 className="font-display text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  {editingItem ? 'Edit Item' : 'New Item'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name *</Label>
                    <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} placeholder="Chicken Biryani" className="mt-1 h-11 rounded-xl bg-muted/30" />
                  </div>
                  {!hasVariants ? (
                    <div>
                      <Label className="text-xs text-muted-foreground">Price (₹) *</Label>
                      <Input type="number" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} placeholder="299" className="mt-1 h-11 rounded-xl bg-muted/30" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Half ₹ *</Label>
                        <Input type="number" value={halfPrice} onChange={e => setHalfPrice(e.target.value)} placeholder="63" className="mt-1 h-11 rounded-xl bg-muted/30" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Full ₹ *</Label>
                        <Input type="number" value={fullPrice} onChange={e => setFullPrice(e.target.value)} placeholder="126" className="mt-1 h-11 rounded-xl bg-muted/30" />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Category *</Label>
                    <select value={itemForm.category_id} onChange={e => setItemForm(p => ({ ...p, category_id: e.target.value }))} className="w-full h-11 mt-1 rounded-xl border border-input bg-muted/30 px-3 text-sm">
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Photo</Label>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const url = await uploadImage(file); if (url) setItemForm(p => ({ ...p, image_url: url })); }} />
                    <div className="flex gap-2 mt-1">
                      <Button type="button" variant="outline" className="flex-1 gap-2 h-11 rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : itemForm.image_url ? 'Change' : 'Upload'}
                      </Button>
                      {itemForm.image_url && <img src={itemForm.image_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-border" />}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the dish..." className="mt-1 rounded-xl bg-muted/30 min-h-[80px]" />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-5 flex-wrap py-1">
                    <div className="flex items-center gap-2">
                      <Switch checked={hasVariants} onCheckedChange={v => { setHasVariants(v); if (!v) { setHalfPrice(''); setFullPrice(''); } }} />
                      <Label className="text-sm cursor-pointer">Half / Full</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={itemForm.is_veg} onCheckedChange={v => setItemForm(p => ({ ...p, is_veg: v }))} />
                      <Label className="text-sm cursor-pointer">Veg</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={itemForm.is_available} onCheckedChange={v => setItemForm(p => ({ ...p, is_available: v }))} />
                      <Label className="text-sm cursor-pointer">Available</Label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <Button onClick={saveItem} className="btn-premium rounded-xl px-6">{editingItem ? 'Update' : 'Add'} Item</Button>
                  {editingItem && <Button variant="outline" className="rounded-xl" onClick={() => { setEditingItem(null); setShowItemForm(false); }}>Cancel</Button>}
                </div>
              </div>
            )}

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map(item => (
                <div key={item._id} className="flex items-center gap-3 bg-card rounded-xl p-3 sm:p-4 border border-border/50 hover:border-primary/20 transition-all group">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-lg">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      {item.is_veg ? (
                        <span className="w-3.5 h-3.5 rounded-sm border-2 border-green-500 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-sm border-2 border-red-500 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">₹{item.price} · {categories.find(c => c._id === item.category_id)?.name || 'N/A'}</p>
                    {!item.is_available && <span className="text-[10px] text-destructive font-medium">Unavailable</span>}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => {
                      const baseName = item.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim();
                      const isVariant = item.name.includes('(Half)') || item.name.includes('(Full)');
                      const matchingVariants = isVariant ? items.filter(i =>
                        i.category_id === item.category_id &&
                        i.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim() === baseName &&
                        (i.name.includes('(Half)') || i.name.includes('(Full)'))
                      ) : [];
                      const halfItem = matchingVariants.find(v => v.name.includes('(Half)'));
                      const fullItem = matchingVariants.find(v => v.name.includes('(Full)'));
                      setEditingItem(item._id);
                      setItemForm({ name: isVariant ? baseName : item.name, description: item.description || '', price: isVariant ? '' : String(item.price), category_id: item.category_id, image_url: item.image_url || '', is_veg: item.is_veg ?? true, is_available: item.is_available ?? true });
                      setHasVariants(isVariant && matchingVariants.length > 1);
                      setHalfPrice(halfItem ? String(halfItem.price) : '');
                      setFullPrice(fullItem ? String(fullItem.price) : '');
                      setShowItemForm(true);
                    }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => deleteItem(item._id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="sm:col-span-2 xl:col-span-3 text-center py-16">
                  <ChefHat className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-sm">No items yet. Add your first menu item!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order._id} className="bg-card rounded-xl p-4 sm:p-5 border border-border/50 hover:border-primary/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${order.status === 'delivered' ? 'bg-green-500/10 border border-green-500/20' :
                      order.status === 'cancelled' ? 'bg-red-500/10 border border-red-500/20' :
                        'bg-primary/10 border border-primary/20'
                      }`}>
                      {order.status === 'delivered' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                        order.status === 'cancelled' ? <Trash2 className="w-4 h-4 text-red-500" /> :
                          <Clock className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">#{order._id.slice(-8)}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">₹{order.totalAmount}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                        order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-primary/10 text-primary'
                      }`}>{order.status}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">📍 {order.delivery_address || 'Address N/A'}</p>
                {order.notes && <p className="text-xs text-muted-foreground mb-2">📝 {order.notes}</p>}
                <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-border/30">
                  {['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={order.status === s ? 'default' : 'outline'}
                      onClick={() => updateOrderStatus(order._id, s)}
                      className={`capitalize text-[11px] h-7 px-2.5 rounded-lg ${order.status === s ? 'shadow-sm' : ''}`}
                    >
                      {s.replace(/_/g, ' ')}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 ml-auto h-7 px-2.5 rounded-lg text-[11px]"
                    onClick={() => { if (confirm('Delete this order?')) deleteOrder(order._id); }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Access Codes tab */}
        {tab === 'access' && !isCodeUser && (
          <div className="space-y-6">
            {/* Create new code */}
            <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Create Access Code
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Label (who is it for) *</Label>
                  <Input value={codeForm.label} onChange={e => setCodeForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Rahul Seller" className="mt-1 h-11 rounded-xl bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Password/Code *</Label>
                  <Input value={codeForm.code} onChange={e => setCodeForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. rahul123" className="mt-1 h-11 rounded-xl bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valid for (hours)</Label>
                  <Input type="number" value={codeForm.hours} onChange={e => setCodeForm(p => ({ ...p, hours: e.target.value }))} placeholder="24" className="mt-1 h-11 rounded-xl bg-muted/30" />
                </div>
              </div>
              <Button onClick={saveAccessCode} className="btn-premium rounded-xl mt-4">
                <Plus className="w-4 h-4 mr-1.5" /> Create Code
              </Button>
            </div>

            {/* Existing codes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accessCodes.map(ac => {
                const expired = new Date(ac.expiresAt) < new Date();
                const active = ac.isActive && !expired;
                return (
                  <div key={ac._id} className={`bg-card rounded-xl p-4 border transition-colors ${active ? 'border-primary/20' : 'border-border/50 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{ac.label}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded-lg font-mono">{ac.code}</code>
                          <button onClick={() => { navigator.clipboard.writeText(ac.code); toast.success('Code copied!'); }} className="text-muted-foreground hover:text-foreground">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                          <CalendarClock className="w-3 h-3" />
                          {expired ? (
                            <span className="text-destructive font-medium">Expired</span>
                          ) : (
                            <span>Expires: {new Date(ac.expiresAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          )}
                        </div>
                        <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider ${active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                          }`}>{active ? 'Active' : expired ? 'Expired' : 'Disabled'}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => toggleCodeActive(ac._id, ac.isActive)}>
                          {ac.isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => deleteAccessCode(ac._id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {accessCodes.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-16">
                  <Key className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-sm">No access codes yet. Create one to share admin access!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
