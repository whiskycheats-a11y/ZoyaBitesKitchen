import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const api = {
  /** Upload image to Cloudinary via edge function */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  /** Create Razorpay order via edge function */
  createRazorpayOrder: async (amount: number, orderId: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ amount, order_id: orderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create payment');
    return data;
  },

  /** Verify Razorpay payment via edge function */
  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
  }) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    return data;
  },

  /** Manage users (admin) via edge function */
  manageUsers: async (body: { action: string; user_id?: string; role?: string }) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  /** MongoDB CRUD operations via edge function */
  mongodb: async (payload: {
    action: 'find' | 'findOne' | 'insertOne' | 'insertMany' | 'updateOne' | 'deleteOne' | 'deleteMany' | 'count';
    database: string;
    collection: string;
    document?: any;
    filter?: Record<string, any>;
    update?: Record<string, any>;
    options?: Record<string, any>;
  }) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/mongodb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'MongoDB request failed');
    return data;
  },
};
