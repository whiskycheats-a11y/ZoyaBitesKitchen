import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, Package, Clock, CheckCircle, XCircle, Truck, ChefHat, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://zoyabiteskitchen.onrender.com';

const allStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  confirmed: { icon: ThumbsUp, color: 'text-blue-500', label: 'Confirmed' },
  preparing: { icon: ChefHat, color: 'text-orange-500', label: 'Preparing' },
  out_for_delivery: { icon: Truck, color: 'text-purple-500', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-500', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: 'Cancelled' },
};

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Fetch orders error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatus = (status: string) => statusConfig[status] || statusConfig.pending;

  const getStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    return allStatuses.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-8">My Orders</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const st = getStatus(order.status);
              const Icon = st.icon;
              const stepIdx = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 border border-border/50"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                    <div>
                      <p className="font-semibold text-sm sm:text-base">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${isCancelled ? 'bg-red-500/10 text-red-500' :
                      order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                        'bg-primary/10 text-primary'
                      }`}>
                      <Icon className="w-4 h-4" /> {st.label}
                    </span>
                  </div>

                  {/* Tracking Stepper */}
                  {!isCancelled && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between relative px-2 sm:px-0">
                        {/* Progress line */}
                        <div className="absolute top-3 sm:top-4 left-4 right-4 sm:left-0 sm:right-0 h-0.5 bg-muted" />
                        <div
                          className="absolute top-3 sm:top-4 left-4 sm:left-0 h-0.5 bg-primary transition-all duration-700"
                          style={{ width: `${(stepIdx / (allStatuses.length - 1)) * 100}%` }}
                        />

                        {allStatuses.map((s, i) => {
                          const sConfig = statusConfig[s];
                          const SIcon = sConfig.icon;
                          const isActive = i <= stepIdx;
                          const isCurrent = i === stepIdx;
                          return (
                            <div key={s} className="flex flex-col items-center relative z-10 w-12 sm:w-auto">
                              <motion.div
                                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all ${isActive
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'bg-card border-muted text-muted-foreground'
                                  }`}
                              >
                                <SIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              </motion.div>
                              <span className={`text-[8px] sm:text-[10px] mt-1 sm:mt-1.5 font-medium text-center leading-tight max-w-[3rem] sm:max-w-none ${isActive ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                {sConfig.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                      <p className="text-sm text-red-500 font-medium">This order was cancelled</p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-1 mb-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.item_name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-border pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <span className="text-xs text-muted-foreground truncate max-w-full">📍 {order.delivery_address}</span>
                    <span className="font-bold text-primary text-lg shrink-0">₹{order.total_amount}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;
