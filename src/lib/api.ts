const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://zoyabiteskitchen.onrender.com';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
});

export const api = {
  /** Upload image to Cloudinary via backend */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  /** Create Razorpay order via backend */
  createRazorpayOrder: async (amount: number, orderId: string) => {
    const res = await fetch(`${API_URL}/api/create-razorpay-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, order_id: orderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create payment');
    return data;
  },

  /** Verify Razorpay payment via backend */
  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
  }) => {
    const res = await fetch(`${API_URL}/api/verify-razorpay-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    return data;
  },

  /** Categories CRUD */
  getCategories: async () => {
    const res = await fetch(`${API_URL}/api/categories`);
    return res.json();
  },
  saveCategory: async (id: string | null, data: any) => {
    const res = await fetch(id ? `${API_URL}/api/categories/${id}` : `${API_URL}/api/categories`, {
      method: id ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteCategory: async (id: string) => {
    const res = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  /** Products CRUD */
  getProducts: async () => {
    const res = await fetch(`${API_URL}/api/products`);
    return res.json();
  },
  saveProduct: async (id: string | null, data: any) => {
    const res = await fetch(id ? `${API_URL}/api/products/${id}` : `${API_URL}/api/products`, {
      method: id ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  /** Orders Management */
  getAdminOrders: async () => {
    const res = await fetch(`${API_URL}/api/admin/orders`, {
      headers: getHeaders(),
    });
    return res.json();
  },
  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  /** Access Codes */
  getAccessCodes: async () => {
    const res = await fetch(`${API_URL}/api/admin/access-codes`, {
      headers: getHeaders(),
    });
    return res.json();
  },
  saveAccessCode: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/access-codes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteAccessCode: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/access-codes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  toggleAccessCode: async (id: string, isActive: boolean) => {
    const res = await fetch(`${API_URL}/api/admin/access-codes/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    return res.json();
  },
};
