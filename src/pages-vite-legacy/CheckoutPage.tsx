import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Truck, CreditCard, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type Address = {
  id: string;
  user_id: string;
  label: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at?: string;
};

const DELIVERY_CHARGE = 40;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({ address_line: '', city: '', state: '', pincode: '', label: 'Home' });
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const grandTotal = totalPrice + DELIVERY_CHARGE;

  useEffect(() => {
    if (!user) { navigate('/auth?redirect=checkout'); return; }
    if (items.length === 0) { navigate('/cart'); return; }
    fetchAddresses();
    loadRazorpayScript();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    const q = query(collection(db, 'users', user.id, 'addresses'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    const list: Address[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Address, 'id'>) }));
    setAddresses(list);
    const def = list.find(a => a.is_default);
    if (def) setSelectedAddress(def.id);
    else if (list.length > 0) setSelectedAddress(list[0].id);
    else setShowNewAddress(true);
  };

  const saveNewAddress = async () => {
    if (!user) return;
    try {
      const isDefault = addresses.length === 0;
      const docRef = await addDoc(collection(db, 'users', user.id, 'addresses'), {
        user_id: user.id,
        ...newAddress,
        is_default: isDefault,
        created_at: new Date().toISOString(),
      });
      if (!isDefault) {
        const currentDefault = addresses.find(a => a.is_default);
        if (currentDefault) {
          await updateDoc(doc(db, 'users', user.id, 'addresses', currentDefault.id), { is_default: false });
        }
      }
      const created: Address = {
        id: docRef.id,
        user_id: user.id,
        ...newAddress,
        is_default: isDefault,
        created_at: new Date().toISOString(),
      };
      setAddresses(prev => [created, ...prev]);
      setSelectedAddress(docRef.id);
      setShowNewAddress(false);
      setNewAddress({ address_line: '', city: '', state: '', pincode: '', label: 'Home' });
    } catch {
      toast.error('Failed to save address');
    }
  };

  const placeOrder = async () => {
    if (!user || !selectedAddress) { toast.error('Please select a delivery address'); return; }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) { toast.error('Payment gateway failed to load. Please refresh.'); return; }

    setLoading(true);
    try {
      const addr = addresses.find(a => a.id === selectedAddress);
      const deliveryStr = `${addr?.address_line}, ${addr?.city}, ${addr?.state} - ${addr?.pincode}`;

    // Simplified: generate a temporary client-side order reference
    const orderId = `rzp_${Date.now().toString(36)}`;

      // 3. Create Razorpay order via backend
      const rzpData = await api.createRazorpayOrder(grandTotal, order.id);

      // 4. Open Razorpay checkout
      const options = {
        key: rzpData.razorpay_key_id,
        amount: rzpData.amount,
        currency: 'INR',
        name: 'ZoyaBites',
    description: `Order #${orderId.slice(0, 8)}`,
    order_id: rzpData.razorpay_order_id,
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || '',
        },
        theme: { color: '#c4873b' },
        handler: async (response: any) => {
          // 5. Verify payment via backend
          try {
            await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
          order_id: orderId,
            });

            clearCart();
            toast.success('Payment successful! Order placed 🎉');
            navigate('/orders');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: async () => {
        // Payment cancelled — no DB write in this simplified flow
            toast.error('Payment cancelled');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
        <h1 className="font-display text-4xl font-bold mb-8">Checkout</h1>

        {/* Address selection */}
        <div className="bg-card rounded-xl p-6 border border-border/50 mb-6">
          <h2 className="font-display text-xl font-semibold mb-4">Delivery Address</h2>
          {addresses.length > 0 && !showNewAddress && (
            <div className="space-y-3">
              {addresses.map(addr => (
                <label
                  key={addr.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input type="radio" name="address" className="sr-only" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} />
                  <span className="text-xs font-bold uppercase text-accent">{addr.label}</span>
                  <p className="text-foreground text-sm mt-1">{addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}</p>
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
          <h2 className="font-display text-xl font-semibold mb-4">Order Notes</h2>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions? (optional)" />
        </div>

        {/* Order summary */}
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {items.map(({ food, quantity }) => (
              <div key={food.id} className="flex justify-between text-sm">
                <span>{food.name} × {quantity}</span>
                <span className="font-medium">₹{(food.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery</span>
              <span>₹{DELIVERY_CHARGE.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-display text-xl font-bold">Total</span>
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
};

export default CheckoutPage;
