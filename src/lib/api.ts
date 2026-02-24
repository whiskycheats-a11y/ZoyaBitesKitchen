const API_URL = (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL)) || 'https://zoyabiteskitchen.onrender.com';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  console.log('[API] Using token:', token ? '***' + token.slice(-5) : 'NONE');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
};

const apiFetch = async (url: string, options: any = {}) => {
  const method = options.method || 'GET';
  console.log(`[API] ${method} ${url}`);
  try {
    const res = await fetch(url, options);
    console.log(`[API] Response: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!res.ok) {
      console.error('[API] Error data:', data);
      if (data.error) throw new Error(data.error);
      throw new Error(`Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error('[API] Fetch exception:', err);
    throw err;
  }
};

export const api = {
  /** Upload image to Cloudinary via backend */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`${API_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });
  },

  /** Create Razorpay order via backend */
  createRazorpayOrder: async (amount: number, orderId: string) => {
    return apiFetch(`${API_URL}/api/create-razorpay-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, order_id: orderId }),
    });
  },

  /** Verify Razorpay payment via backend */
  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
  }) => {
    return apiFetch(`${API_URL}/api/verify-razorpay-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },

  /** Categories CRUD */
  getCategories: async () => {
    return apiFetch(`${API_URL}/api/categories`);
  },
  saveCategory: async (id: string | null, data: any) => {
    return apiFetch(id ? `${API_URL}/api/categories/${id}` : `${API_URL}/api/categories`, {
      method: id ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteCategory: async (id: string) => {
    return apiFetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  /** Products CRUD */
  getProducts: async () => {
    return apiFetch(`${API_URL}/api/products`);
  },
  saveProduct: async (id: string | null, data: any) => {
    return apiFetch(id ? `${API_URL}/api/products/${id}` : `${API_URL}/api/products`, {
      method: id ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteProduct: async (id: string) => {
    return apiFetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  /** Orders Management */
  getAdminOrders: async () => {
    return apiFetch(`${API_URL}/api/admin/orders`, {
      headers: getHeaders(),
    });
  },
  createOrder: async (data: any) => {
    return apiFetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getUserOrders: async () => {
    return apiFetch(`${API_URL}/api/orders`, {
      headers: getHeaders(),
    });
  },

  /** Address Management */
  getAddresses: async () => {
    return apiFetch(`${API_URL}/api/addresses`, {
      headers: getHeaders(),
    });
  },
  saveAddress: async (data: any) => {
    return apiFetch(`${API_URL}/api/addresses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  setDefaultAddress: async (id: string) => {
    return apiFetch(`${API_URL}/api/addresses/${id}/default`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },
  deleteAddress: async (id: string) => {
    return apiFetch(`${API_URL}/api/addresses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  /** Profile Management */
  getProfile: async () => {
    return apiFetch(`${API_URL}/api/profile`, {
      headers: getHeaders(),
    });
  },
  updateProfile: async (data: any) => {
    return apiFetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  updateOrderStatus: async (id: string, status: string) => {
    return apiFetch(`${API_URL}/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  /** Access Codes */
  getAccessCodes: async () => {
    return apiFetch(`${API_URL}/api/admin/access-codes`, {
      headers: getHeaders(),
    });
  },
  saveAccessCode: async (data: any) => {
    return apiFetch(`${API_URL}/api/admin/access-codes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteAccessCode: async (id: string) => {
    return apiFetch(`${API_URL}/api/admin/access-codes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  toggleAccessCode: async (id: string, isActive: boolean) => {
    return apiFetch(`${API_URL}/api/admin/access-codes/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
  },
};
