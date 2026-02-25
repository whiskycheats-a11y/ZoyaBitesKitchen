const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || '');

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
};

const apiFetch = async (url: string, options: any = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Server returned invalid response');
  }
  if (!res.ok) {
    if (data.error) throw new Error(data.error);
    throw new Error(`Request failed with status ${res.status}`);
  }
  return data;
};

export { API_BASE };

export const api = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch(`${API_BASE}/api/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token || ''}` },
      body: formData,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('Upload failed: invalid response');
    }
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  createRazorpayOrder: async (amount: number, orderId: string) => {
    return apiFetch(`/api/create-razorpay-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, order_id: orderId }),
    });
  },

  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
  }) => {
    return apiFetch(`/api/verify-razorpay-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },

  getCategories: async () => {
    return apiFetch(`/api/categories`);
  },
  saveCategory: async (id: string | null, data: any) => {
    return apiFetch(id ? `/api/categories/${id}` : `/api/categories`, {
      method: id ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteCategory: async (id: string) => {
    return apiFetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  getProducts: async () => {
    return apiFetch(`/api/products`);
  },
  saveProduct: async (id: string | null, data: any) => {
    return apiFetch(id ? `/api/products/${id}` : `/api/products`, {
      method: id ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteProduct: async (id: string) => {
    return apiFetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  getAdminOrders: async () => {
    return apiFetch(`/api/admin/orders`, {
      headers: getHeaders(),
    });
  },
  createOrder: async (data: any) => {
    return apiFetch(`/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getUserOrders: async () => {
    return apiFetch(`/api/orders`, {
      headers: getHeaders(),
    });
  },

  getAddresses: async () => {
    return apiFetch(`/api/addresses`, {
      headers: getHeaders(),
    });
  },
  saveAddress: async (data: any) => {
    return apiFetch(`/api/addresses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  setDefaultAddress: async (id: string) => {
    return apiFetch(`/api/addresses/${id}/default`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },
  deleteAddress: async (id: string) => {
    return apiFetch(`/api/addresses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  getProfile: async () => {
    return apiFetch(`/api/profile`, {
      headers: getHeaders(),
    });
  },
  updateProfile: async (data: any) => {
    return apiFetch(`/api/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  updateOrderStatus: async (id: string, status: string) => {
    return apiFetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  getAccessCodes: async () => {
    return apiFetch(`/api/admin/access-codes`, {
      headers: getHeaders(),
    });
  },
  saveAccessCode: async (data: any) => {
    return apiFetch(`/api/admin/access-codes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteAccessCode: async (id: string) => {
    return apiFetch(`/api/admin/access-codes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  toggleAccessCode: async (id: string, isActive: boolean) => {
    return apiFetch(`/api/admin/access-codes/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
  },

  verifyAdminCode: async (code: string) => {
    return apiFetch(`/api/admin/verify-code`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code }),
    });
  },

  getManageUsers: async () => {
    return apiFetch(`/api/manage-users`, {
      headers: getHeaders(),
    });
  },
};
