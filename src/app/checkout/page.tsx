'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Truck, CreditCard, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Address = {
    _id: string;
    label: string;
    address_line: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
};

const DELIVERY_CHARGE = 40;

declare global {
    interface Window {
        Razorpay: any;
    }
}

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) { resolve(true); return; }
        if (typeof document === 'undefined') { resolve(false); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.id = 'razorpay-checkout-js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function CheckoutPage() {
    const { user } = useAuth();
    const { items, totalPrice, clearCart } = useCart();
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [newAddress, setNewAddress] = useState({ address_line: '', city: '', state: '', pincode: '', label: 'Home' });
    const [showNewAddress, setShowNewAddress] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const grandTotal = totalPrice + DELIVERY_CHARGE;

    const fetchAddresses = async () => {
        if (!user) return;
        try {
            const list = await api.getAddresses();
            setAddresses(list || []);
            const def = (list || []).find((a: any) => a.is_default);
            if (def) setSelectedAddress(def._id);
            else if (list && list.length > 0) setSelectedAddress(list[0]._id);
            else setShowNewAddress(true);
        } catch (err) {
            console.error('Fetch addresses error', err);
        }
    };

    useEffect(() => {
        if (!user) { router.push('/auth?redirect=checkout'); return; }
        if (items.length === 0) { router.push('/cart'); return; }
        fetchAddresses();
        loadRazorpayScript();
    }, [user, items.length, router]);

    const saveNewAddress = async () => {
        if (!user) return;
        try {
            const result = await api.saveAddress({
                ...newAddress,
                is_default: addresses.length === 0,
            });
            setAddresses(prev => [result, ...prev]);
            setSelectedAddress(result._id);
            setShowNewAddress(false);
            setNewAddress({ address_line: '', city: '', state: '', pincode: '', label: 'Home' });
            toast.success('Address saved!');
        } catch {
            toast.error('Failed to save address');
        }
    };

    const placeOrder = async () => {
        console.log('[Checkout] Starting placeOrder...');
        if (!user || !selectedAddress) {
            console.warn('[Checkout] Missing user or selectedAddress', { hasUser: !!user, selectedAddress });
            toast.error('Please select a delivery address');
            return;
        }

        console.log('[Checkout] Loading Razorpay script...');
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            console.error('[Checkout] Razorpay script failed to load.');
            toast.error('Payment gateway failed to load. Please refresh.');
            return;
        }

        setLoading(true);
        try {
            const addr = addresses.find(a => a._id === selectedAddress);
            const deliveryStr = `${addr?.address_line}, ${addr?.city}${addr?.state ? `, ${addr?.state}` : ''} - ${addr?.pincode}`;
            console.log('[Checkout] Delivery string:', deliveryStr);

            // 1. Create order in DB (pending status)
            console.log('[Checkout] Step 1: Creating order in DB...');
            const order = await api.createOrder({
                items: items.map(item => ({
                    productId: (item.food as any)._id || (item.food as any).id,
                    name: item.food.name,
                    quantity: item.quantity,
                    price: item.food.price
                })),
                totalAmount: grandTotal,
                deliveryAddress: deliveryStr,
                notes
            });
            console.log('[Checkout] Step 1 Success: Order created', order._id);

            // 2. Create Razorpay order via backend
            console.log('[Checkout] Step 2: Creating Razorpay order...');
            const rzpData = await api.createRazorpayOrder(grandTotal, order._id);
            console.log('[Checkout] Step 2 Success: Razorpay data received', rzpData.razorpay_order_id);

            // 3. Open Razorpay checkout
            console.log('[Checkout] Step 3: Initializing Razorpay modal...');
            const options = {
                key: rzpData.razorpay_key_id,
                amount: rzpData.amount,
                currency: 'INR',
                name: 'ZoyaBites',
                description: `Order #${order._id.slice(-8)}`,
                order_id: rzpData.razorpay_order_id,
                prefill: {
                    email: user.email || '',
                    name: (user as any).name || (user as any).displayName || '',
                    contact: (user as any).phone || '',
                },
                theme: { color: '#c4873b' },
                handler: async (response: any) => {
                    console.log('[Checkout] Step 4: Razorpay handler called', response.razorpay_payment_id);
                    // 4. Verify payment via backend
                    try {
                        console.log('[Checkout] Verifying payment on backend...');
                        await api.verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: order._id,
                        });
                        console.log('[Checkout] Payment verification success!');

                        clearCart();
                        toast.success('Payment successful! Order placed 🎉');
                        router.push('/orders');
                    } catch (err: any) {
                        console.error('[Checkout] Payment verification failed:', err);
                        toast.error(err.message || 'Payment verification failed. Contact support.');
                    }
                },
                modal: {
                    ondismiss: () => {
                        console.log('[Checkout] Razorpay modal dismissed by user.');
                        toast.error('Payment cancelled');
                        setLoading(false);
                    },
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            console.log('[Checkout] Razorpay modal opened.');
            setLoading(false);
        } catch (err) {
            console.error('[Checkout] placeOrder Exception:', err);
            const message = err instanceof Error ? err.message : 'Failed to place order';
            toast.error(message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
                <h1 className="font-display text-4xl font-bold mb-8 text-foreground">Checkout</h1>

                {/* Address selection */}
                <div className="bg-card rounded-xl p-6 border border-border/50 mb-6 font-sans">
                    <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Delivery Address</h2>
                    {addresses.length > 0 && !showNewAddress && (
                        <div className="space-y-3">
                            {addresses.map(addr => (
                                <label
                                    key={addr._id}
                                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${selectedAddress === addr._id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <input type="radio" name="address" className="sr-only" checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} />
                                    <span className="text-xs font-bold uppercase text-accent">{addr.label}</span>
                                    <p className="text-foreground text-sm mt-1">{addr.address_line}, {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.pincode}</p>
                                </label>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setShowNewAddress(true)}>+ Add New Address</Button>
                        </div>
                    )}

                    {showNewAddress && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><Label>Label</Label><Input value={newAddress.label} onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))} placeholder="Home / Office" /></div>
                                <div><Label>Pincode</Label><Input value={newAddress.pincode} onChange={e => setNewAddress(p => ({ ...p, pincode: e.target.value }))} placeholder="123456" /></div>
                            </div>
                            <div><Label>Address</Label><Input value={newAddress.address_line} onChange={e => setNewAddress(p => ({ ...p, address_line: e.target.value }))} placeholder="House/Flat, Street, Area" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><Label>City</Label><Input value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" /></div>
                                <div><Label>State</Label><Input value={newAddress.state} onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))} placeholder="State" /></div>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={saveNewAddress}>Save Address</Button>
                                {addresses.length > 0 && <Button variant="outline" onClick={() => setShowNewAddress(false)}>Cancel</Button>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Order notes */}
                <div className="bg-card rounded-xl p-6 border border-border/50 mb-6">
                    <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Order Notes</h2>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions? (optional)" />
                </div>

                {/* Order summary */}
                <div className="bg-card rounded-xl p-6 border border-border/50">
                    <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Order Summary</h2>
                    <div className="space-y-2 mb-4">
                        {items.map(({ food, quantity }) => (
                            <div key={food.id} className="flex justify-between text-sm">
                                <span>{food.name} × {quantity}</span>
                                <span className="font-medium text-foreground">₹{(food.price * quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery</span>
                            <span className="text-foreground">₹{DELIVERY_CHARGE.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-3 flex justify-between">
                            <span className="font-display text-xl font-bold text-foreground">Total</span>
                            <span className="font-display text-xl font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2 text-sm text-foreground/70">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span>Secure payment via Razorpay (UPI, Cards, Net Banking)</span>
                    </div>

                    <Button className="w-full mt-4 btn-premium rounded-xl" size="lg" onClick={placeOrder} disabled={loading || !selectedAddress}>
                        {loading ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
                        ) : (
                            <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pay ₹{grandTotal.toFixed(2)}</span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
