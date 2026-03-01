'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Package, Upload, ImageIcon, Users, ShieldCheck, ShieldOff, Lock, ChefHat, ShoppingBag, LayoutGrid, TrendingUp, IndianRupee, Clock, CheckCircle2, Key, Copy, CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';

const API_URL = (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL)) || 'https://zoyabiteskitchen.onrender.com';

type Category = { _id: string; name: string; description?: string; image_url?: string; };
type FoodItem = { _id: string; name: string; description?: string; price: number; category_id: string; image_url?: string; is_veg?: boolean; is_available?: boolean; };
type Order = { _id: string; status: string; paymentStatus?: string; totalAmount: number; createdAt: string; delivery_address?: string; deliveryAddress?: string; notes?: string; items?: any[]; };

const ADMIN_PASSWORD = 'henakhan@@@2050';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
});

export default function AdminPage() {
    const { user, isAdmin, isSeller, loading: authLoading } = useAuth();
    const router = useRouter();
    const [adminUnlocked, setAdminUnlocked] = useState(false);
    const [adminPass, setAdminPass] = useState('');
    const [passError, setPassError] = useState(false);
    const [tab, setTab] = useState<'categories' | 'items' | 'orders' | 'access'>('items');
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<FoodItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCodeUser, setIsCodeUser] = useState(false);

    // Access codes
    const [accessCodes, setAccessCodes] = useState<any[]>([]);
    const [codeForm, setCodeForm] = useState({ label: '', code: '', hours: '24' });

    // Category form
    const [catForm, setCatForm] = useState({ name: '', description: '', image_url: '' });
    const [editingCat, setEditingCat] = useState<string | null>(null);

    // Item form
    const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '', is_veg: true as boolean | null, is_available: true });
    const [hasVariants, setHasVariants] = useState(false);
    const [halfPrice, setHalfPrice] = useState('');
    const [fullPrice, setFullPrice] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [showItemForm, setShowItemForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const catFileInputRef = useRef<HTMLInputElement>(null);

    const fetchCategories = async () => {
        const res = await fetch(`${API_URL}/api/categories`, { headers: getHeaders() });
        if (res.ok) setCategories(await res.json());
    };

    const fetchItems = async () => {
        const res = await fetch(`${API_URL}/api/products`, { headers: getHeaders() });
        if (res.ok) setItems(await res.json());
    };

    const fetchOrders = async () => {
        const res = await fetch(`${API_URL}/api/orders/all`, { headers: getHeaders() });
        if (res.ok) setOrders(await res.json());
    };

    const fetchAll = async () => {
        await Promise.all([fetchCategories(), fetchItems(), fetchOrders()]);
        setLoading(false);
    };

    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (!adminUnlocked) return;
        setAuthChecked(true);
        fetchAll();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [adminUnlocked]);

    const uploadImage = async (file: File): Promise<string | null> => {
        setUploading(true);
        try {
            const data = await api.uploadImage(file);
            toast.success('Photo uploaded!');
            return data.url;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Category CRUD
    const saveCategory = async () => {
        if (!catForm.name.trim()) { toast.error('Category name required'); return; }
        const url = editingCat ? `${API_URL}/api/categories/${editingCat}` : `${API_URL}/api/categories`;
        const method = editingCat ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(catForm) });
        if (!res.ok) { toast.error((await res.json()).error || 'Error'); return; }
        toast.success(editingCat ? 'Category updated' : 'Category added');
        setCatForm({ name: '', description: '', image_url: '' });
        setEditingCat(null);
        fetchCategories();
    };

    const deleteCategory = async (id: string) => {
        const res = await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) { toast.error('Failed to delete'); return; }
        toast.success('Category deleted');
        fetchCategories(); fetchItems();
    };

    // Item CRUD
    const saveItem = async () => {
        if (!itemForm.name.trim() || !itemForm.category_id) {
            toast.error('Name and category are required'); return;
        }

        if (hasVariants) {
            if (!halfPrice || !fullPrice) { toast.error('Both Half and Full prices are required'); return; }
            const baseName = itemForm.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim();
            const basePayload = { description: itemForm.description, category_id: itemForm.category_id, image_url: itemForm.image_url, is_veg: itemForm.is_veg, is_available: itemForm.is_available };

            if (editingItem) {
                const existingVariants = items.filter(i =>
                    i.category_id === itemForm.category_id &&
                    i.name.replace(/\s*\((Half|Full)\)\s*/i, '').trim() === baseName
                );
                const halfItem = existingVariants.find(i => i.name.includes('(Half)'));
                const fullItem = existingVariants.find(i => i.name.includes('(Full)'));
                if (halfItem) {
                    await fetch(`${API_URL}/api/products/${halfItem._id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ ...basePayload, name: `${baseName} (Half)`, price: parseFloat(halfPrice) }) });
                } else {
                    await fetch(`${API_URL}/api/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ ...basePayload, name: `${baseName} (Half)`, price: parseFloat(halfPrice) }) });
                }
                if (fullItem) {
                    await fetch(`${API_URL}/api/products/${fullItem._id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ ...basePayload, name: `${baseName} (Full)`, price: parseFloat(fullPrice) }) });
                } else {
                    await fetch(`${API_URL}/api/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ ...basePayload, name: `${baseName} (Full)`, price: parseFloat(fullPrice) }) });
                }
                toast.success('Item updated with variants');
            } else {
                const [r1, r2] = await Promise.all([
                    fetch(`${API_URL}/api/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ ...basePayload, name: `${baseName} (Half)`, price: parseFloat(halfPrice) }) }),
                    fetch(`${API_URL}/api/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ ...basePayload, name: `${baseName} (Full)`, price: parseFloat(fullPrice) }) }),
                ]);
                if (!r1.ok || !r2.ok) { toast.error('Error adding variants'); return; }
                toast.success('Item added with Half/Full variants');
            }
        } else {
            if (!itemForm.price) { toast.error('Price is required'); return; }
            const payload = { ...itemForm, price: parseFloat(itemForm.price) };
            const url = editingItem ? `${API_URL}/api/products/${editingItem}` : `${API_URL}/api/products`;
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            if (!res.ok) { toast.error((await res.json()).error || 'Error'); return; }
            toast.success(editingItem ? 'Item updated' : 'Item added');
        }
        setItemForm({ name: '', description: '', price: '', category_id: '', image_url: '', is_veg: true, is_available: true });
        setHasVariants(false); setHalfPrice(''); setFullPrice('');
        setEditingItem(null); setShowItemForm(false);
        fetchItems();
    };

    const deleteItem = async (id: string) => {
        const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) {
            toast.error('Item has orders. Deactivating instead.');
            await fetch(`${API_URL}/api/products/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ is_available: false }) });
            fetchItems();
            return;
        }
        toast.success('Item deleted');
        fetchItems();
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) });
        if (!res.ok) toast.error('Failed');
        else { toast.success(`Order ${status}`); fetchOrders(); }
    };

    const deleteOrder = async (orderId: string) => {
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) { toast.error('Failed to delete'); return; }
        toast.success('Order deleted');
        fetchOrders();
    };

    const handleAdminLogin = async () => {
        if (adminPass === ADMIN_PASSWORD) {
            setAdminUnlocked(true); setIsCodeUser(false); setPassError(false); return;
        }
        try {
            const res = await fetch(`${API_URL}/api/admin/verify-code`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify({ code: adminPass })
            });
            if (res.ok) {
                setAdminUnlocked(true); setIsCodeUser(true); setPassError(false);
            } else {
                setPassError(true);
            }
        } catch {
            setPassError(true);
        }
    };

    // Access code CRUD
    const fetchAccessCodes = async () => {
        const res = await fetch(`${API_URL}/api/admin/access-codes`, { headers: getHeaders() });
        if (res.ok) setAccessCodes(await res.json());
    };

    const saveAccessCode = async () => {
        if (!codeForm.label.trim() || !codeForm.code.trim()) { toast.error('Label and code are required'); return; }
        const hours = parseInt(codeForm.hours) || 24;
        const expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        const res = await fetch(`${API_URL}/api/admin/access-codes`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({ label: codeForm.label, code: codeForm.code, expires_at })
        });
        if (!res.ok) { toast.error('Failed'); return; }
        toast.success('Access code created!');
        setCodeForm({ label: '', code: '', hours: '24' });
        fetchAccessCodes();
    };

    const deleteAccessCode = async (id: string) => {
        const res = await fetch(`${API_URL}/api/admin/access-codes/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) { toast.error('Failed'); return; }
        toast.success('Code deleted');
        fetchAccessCodes();
    };

    const toggleCodeActive = async (id: string, active: boolean) => {
        await fetch(`${API_URL}/api/admin/access-codes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ is_active: !active }) });
        fetchAccessCodes();
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
                    <h2 className="font-display text-2xl font-bold text-center mb-1 text-foreground">Admin Access</h2>
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

    const stats = [
        { icon: ChefHat, label: 'Menu Items', value: items.length, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
        { icon: ShoppingBag, label: 'Total Orders', value: orders.length, color: 'text-foreground', bg: 'bg-muted/10 border-border/20' },
        { icon: Clock, label: 'Pending', value: pendingOrders, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        { icon: IndianRupee, label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    ];

    const tabConfig = [
        { key: 'items' as const, label: 'Items', icon: ChefHat, count: items.length },
        { key: 'categories' as const, label: 'Categories', icon: LayoutGrid, count: categories.length },
        { key: 'orders' as const, label: 'Orders', icon: ShoppingBag, count: pendingOrders || undefined },
        ...(!isCodeUser ? [{ key: 'access' as const, label: 'Access', icon: Key }] : []),
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Dashboard</h1>
                        <p className="text-muted-foreground text-sm mt-1">Manage your restaurant</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

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

                <div className="flex gap-1.5 sm:gap-2 mb-6 bg-muted/30 p-1.5 rounded-xl border border-border/30 overflow-x-auto">
                    {tabConfig.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === t.key
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-sans'
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
                                        <Label className="text-xs text-muted-foreground font-sans">Name *</Label>
                                        <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} placeholder="Chicken Biryani" className="mt-1 h-11 rounded-xl bg-muted/30" />
                                    </div>
                                    {!hasVariants ? (
                                        <div>
                                            <Label className="text-xs text-muted-foreground font-sans">Price (₹) *</Label>
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
                                        <Label className="text-xs text-muted-foreground font-sans">Category *</Label>
                                        <select value={itemForm.category_id} onChange={e => setItemForm(p => ({ ...p, category_id: e.target.value }))} className="w-full h-11 mt-1 rounded-xl border border-input bg-muted/30 px-3 text-sm">
                                            <option value="">Select category</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground font-sans">Photo</Label>
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
                                        <Label className="text-xs text-muted-foreground font-sans">Description</Label>
                                        <Textarea value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the dish..." className="mt-1 rounded-xl bg-muted/30 min-h-[80px]" />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center gap-5 flex-wrap py-1">
                                        <div className="flex items-center gap-2">
                                            <Switch checked={hasVariants} onCheckedChange={v => { setHasVariants(v); if (!v) { setHalfPrice(''); setFullPrice(''); } }} />
                                            <Label className="text-sm cursor-pointer">Half / Full</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={itemForm.is_veg === true ? 'veg' : itemForm.is_veg === false ? 'non-veg' : 'none'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setItemForm(p => ({ ...p, is_veg: val === 'veg' ? true : val === 'non-veg' ? false : null }));
                                                }}
                                                className="h-9 px-2 rounded-lg border border-input bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="veg">Veg</option>
                                                <option value="non-veg">Non-Veg</option>
                                                <option value="none">No Tag</option>
                                            </select>
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
                                            <h3 className="font-semibold text-sm truncate font-display">{item.name}</h3>
                                            {item.is_veg === true ? (
                                                <span className="w-3.5 h-3.5 rounded-sm border-2 border-green-500 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                                            ) : item.is_veg === false ? (
                                                <span className="w-3.5 h-3.5 rounded-sm border-2 border-red-500 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /></span>
                                            ) : null}
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
                                            setItemForm({ name: isVariant ? baseName : item.name, description: item.description || '', price: isVariant ? '' : String(item.price), category_id: item.category_id, image_url: item.image_url || '', is_veg: item.is_veg !== undefined ? item.is_veg : null, is_available: item.is_available ?? true });
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
                        </div>
                    </div>
                )}

                {tab === 'orders' && (
                    <div className="space-y-3">
                        {orders.length === 0 ? (
                            <div className="text-center py-20 font-sans">
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
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 font-sans' :
                                            order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 font-sans' :
                                                order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 font-sans' :
                                                    'bg-primary/10 text-primary font-sans'
                                            }`}>{order.status}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">📍 {order.delivery_address}</p>
                                {order.notes && <p className="text-xs text-muted-foreground mb-2 italic">📝 {order.notes}</p>}
                                <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-border/30">
                                    {['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                                        <Button
                                            key={s}
                                            size="sm"
                                            variant={order.status === s ? 'default' : 'outline'}
                                            onClick={() => updateOrderStatus(order._id, s)}
                                            className={`capitalize text-[11px] h-7 px-2.5 rounded-lg ${order.status === s ? 'shadow-sm' : ''} font-sans`}
                                        >
                                            {s.replace(/_/g, ' ')}
                                        </Button>
                                    ))}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 ml-auto h-7 px-2.5 rounded-lg text-[11px] font-sans"
                                        onClick={() => { if (confirm('Delete this order?')) deleteOrder(order._id); }}
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'access' && !isCodeUser && (
                    <div className="space-y-6">
                        <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50">
                            <h2 className="font-display text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" />
                                Create Access Code
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground font-sans">Label (who is it for) *</Label>
                                    <Input value={codeForm.label} onChange={e => setCodeForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Rahul Seller" className="mt-1 h-11 rounded-xl bg-muted/30" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground font-sans">Password/Code *</Label>
                                    <Input value={codeForm.code} onChange={e => setCodeForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. rahul123" className="mt-1 h-11 rounded-xl bg-muted/30" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground font-sans">Valid for (hours)</Label>
                                    <Input type="number" value={codeForm.hours} onChange={e => setCodeForm(p => ({ ...p, hours: e.target.value }))} placeholder="24" className="mt-1 h-11 rounded-xl bg-muted/30" />
                                </div>
                            </div>
                            <Button onClick={saveAccessCode} className="btn-premium rounded-xl mt-4">
                                <Plus className="w-4 h-4 mr-1.5" /> Create Code
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {accessCodes.map(ac => {
                                const expired = new Date(ac.expires_at) < new Date();
                                const active = ac.is_active && !expired;
                                return (
                                    <div key={ac._id} className={`bg-card rounded-xl p-4 border transition-colors ${active ? 'border-primary/20' : 'border-border/50 opacity-60'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm truncate">{ac.label}</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded-lg font-mono text-foreground">{ac.code}</code>
                                                    <button onClick={() => { navigator.clipboard.writeText(ac.code); toast.success('Code copied!'); }} className="text-muted-foreground hover:text-foreground">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground font-sans">
                                                    <CalendarClock className="w-3 h-3" />
                                                    {expired ? (
                                                        <span className="text-destructive font-medium">Expired</span>
                                                    ) : (
                                                        <span>Expires: {new Date(ac.expires_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                    )}
                                                </div>
                                                <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider font-sans ${active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                                                    }`}>{active ? 'Active' : expired ? 'Expired' : 'Disabled'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => toggleCodeActive(ac._id, ac.is_active)}>
                                                    {ac.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => deleteAccessCode(ac._id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
