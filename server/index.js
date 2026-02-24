require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
const allowedOrigins = [
  'https://zoyabites.com',
  'https://www.zoyabites.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String },
  phone: { type: String },
  address: { type: String },
  roles: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const accessCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  deliveryAddress: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

const Address = mongoose.model('Address', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, default: 'Home' },
  address_line: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String, required: true },
  is_default: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

const AccessCode = mongoose.model('AccessCode', accessCodeSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

// Helper: Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id, email: user.email, roles: user.roles }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Get user from auth token
const getUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    return user;
  } catch {
    return null;
  }
};

// Helper: Check if user is admin
const isAdmin = async (user) => {
  return user?.roles?.includes('admin') || false;
};

// Helper: Check admin access (user JWT OR admin password header)
const checkAdminAccess = async (req) => {
  // Check admin password header
  const adminPwd = req.headers['x-admin-password'];
  if (adminPwd === process.env.ADMIN_PASSWORD || adminPwd === 'henakhan@@@2050') return true;
  // Check user JWT with admin role
  const user = await getUser(req);
  if (user && await isAdmin(user)) return true;
  return false;
};

// ============================================
// ROUTE: Auth - Register
// ============================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ email, password, name, phone });
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, roles: user.roles } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Auth - Login
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, roles: user.roles } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Auth - Get Current User
// ============================================
app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ user: { id: user._id, email: user.email, name: user.name, phone: user.phone, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Profile - Get/Update
// ============================================
app.get('/api/profile', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ full_name: user.name, phone: user.phone, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { full_name, phone } = req.body;
    if (full_name) user.name = full_name;
    if (phone) user.phone = phone;
    await user.save();

    res.json({ success: true, full_name: user.name, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { full_name, phone } = req.body;
    if (full_name) user.name = full_name;
    if (phone) user.phone = phone;
    await user.save();

    res.json({ success: true, full_name: user.name, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Addresses Management
// ============================================
app.get('/api/addresses', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const addrs = await Address.find({ userId: user._id }).sort({ is_default: -1, createdAt: -1 });
    res.json(addrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/addresses', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { label, address_line, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await Address.updateMany({ userId: user._id }, { is_default: false });
    } else {
      const count = await Address.countDocuments({ userId: user._id });
      if (count === 0) req.body.is_default = true;
    }

    const addr = new Address({
      userId: user._id,
      label, address_line, city, state, pincode,
      is_default: req.body.is_default || is_default || false
    });
    await addr.save();
    res.json(addr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/addresses/:id/default', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await Address.updateMany({ userId: user._id }, { is_default: false });
    await Address.findByIdAndUpdate(req.params.id, { is_default: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/addresses/:id', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await Address.deleteOne({ _id: req.params.id, userId: user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Upload Image to Cloudinary
// ============================================
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided' });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Cloudinary not configured' });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'zoyabites';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    const FormData = (await import('node-fetch')).FormData;
    const Blob = (await import('node-fetch')).Blob;
    const fetch = (await import('node-fetch')).default;

    const formData = new FormData();
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await cloudRes.json();
    if (!cloudRes.ok) {
      return res.status(400).json({ error: result.error?.message || 'Upload failed' });
    }

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Create Razorpay Order
// ============================================
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, order_id } = req.body;

    if (!amount || !order_id) {
      return res.status(400).json({ error: 'Missing amount or order_id' });
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ error: 'Razorpay not configured' });
    }

    const amountInPaise = Math.round(amount * 100);
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const fetch = (await import('node-fetch')).default;
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order_id,
        notes: { order_id },
      }),
    });

    const rzpOrder = await rzpRes.json();
    console.log('Razorpay response:', rzpRes.status, JSON.stringify(rzpOrder));

    if (!rzpRes.ok) {
      return res.status(400).json({ error: rzpOrder.error?.description || 'Failed to create payment' });
    }

    // Update order with razorpay_order_id
    await Order.findByIdAndUpdate(order_id, { razorpayOrderId: rzpOrder.id });

    res.json({
      razorpay_order_id: rzpOrder.id,
      razorpay_key_id: razorpayKeyId,
      amount: amountInPaise,
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Verify Razorpay Payment
// ============================================
app.post('/api/verify-razorpay-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return res.status(500).json({ error: 'Razorpay not configured' });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update order as paid
    await Order.findByIdAndUpdate(order_id, {
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      status: 'confirmed',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Orders - Create
// ============================================
app.post('/api/orders', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { items, totalAmount, deliveryAddress, notes } = req.body;
    const order = new Order({ userId: user._id, items, totalAmount, deliveryAddress, notes });
    await order.save();

    res.json({ order: { _id: order._id, id: order._id, items, totalAmount, status: order.status } });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Orders - Get User Orders
// ============================================
app.get('/api/orders', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(orders); // plain array
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Orders - Get All (Admin)
// ============================================
app.get('/api/orders/all', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Orders - Update Status (Admin)
// ============================================
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Orders - Delete (Admin)
// ============================================
app.delete('/api/orders/:id', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Menu - Public (categories + products)
// ============================================
app.get('/api/menu', async (req, res) => {
  try {
    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Product.find({ isAvailable: true }).sort({ sortOrder: 1, name: 1 })
    ]);
    res.json({
      categories: categories.map(c => ({
        _id: c._id.toString(),
        id: c._id.toString(),
        name: c.name,
        sortOrder: c.sortOrder,
      })),
      items: products.map(p => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.imageUrl,
        is_veg: p.isVeg,
        is_available: p.isAvailable,
        category_id: p.categoryId ? p.categoryId.toString() : null,
        sort_order: p.sortOrder,
      })),
    });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Categories CRUD (Admin)
// ============================================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const { name, description, image_url } = req.body;
    const category = new Category({ name, description, imageUrl: image_url || req.body.imageUrl, isActive: true });
    await category.save();
    res.json({ ...category.toObject(), _id: category._id, image_url: category.imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const { name, description, image_url } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, imageUrl: image_url || req.body.imageUrl },
      { new: true }
    );
    res.json({ ...category.toObject(), _id: category._id, image_url: category.imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Products CRUD (Admin)
// ============================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ sortOrder: 1, name: 1 });
    // Return snake_case fields so admin page can use them directly
    res.json(products.map(p => ({
      _id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      image_url: p.imageUrl,
      is_veg: p.isVeg,
      is_available: p.isAvailable,
      category_id: p.categoryId ? p.categoryId.toString() : null,
      sort_order: p.sortOrder,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const { name, description, price, category_id, image_url, is_veg, is_available } = req.body;
    const product = new Product({
      name, description, price,
      categoryId: category_id,
      imageUrl: image_url,
      isVeg: is_veg !== undefined ? is_veg : true,
      isAvailable: is_available !== undefined ? is_available : true,
    });
    await product.save();
    res.json({ _id: product._id, name: product.name, description: product.description, price: product.price, image_url: product.imageUrl, is_veg: product.isVeg, is_available: product.isAvailable, category_id: product.categoryId?.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const { name, description, price, category_id, image_url, is_veg, is_available } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category_id !== undefined) updateData.categoryId = category_id;
    if (image_url !== undefined) updateData.imageUrl = image_url;
    if (is_veg !== undefined) updateData.isVeg = is_veg;
    if (is_available !== undefined) updateData.isAvailable = is_available;
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ _id: product._id, name: product.name, description: product.description, price: product.price, image_url: product.imageUrl, is_veg: product.isVeg, is_available: product.isAvailable, category_id: product.categoryId?.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Admin Order Management (legacy path + new path)
// ============================================
app.get('/api/admin/orders', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/orders/:id', async (req, res) => {
  try {
    if (!await checkAdminAccess(req)) return res.status(403).json({ error: 'Admin only' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Admin Verify Code
// ============================================
app.post('/api/admin/verify-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    // Check master password
    if (code === 'henakhan@@@2050' || code === process.env.ADMIN_PASSWORD) {
      return res.json({ success: true, type: 'master' });
    }

    // Check access codes
    const accessCode = await AccessCode.findOne({
      code,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    if (accessCode) {
      return res.json({ success: true, type: 'code' });
    }

    return res.status(401).json({ error: 'Invalid or expired code' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Admin Access Codes
// ============================================
app.get('/api/admin/access-codes', async (req, res) => {
  try {
    const codes = await AccessCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/access-codes', async (req, res) => {
  try {
    const code = new AccessCode(req.body);
    await code.save();
    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/access-codes/:id', async (req, res) => {
  try {
    const code = await AccessCode.findByIdAndUpdate(req.params.id, { isActive: req.body.is_active !== undefined ? req.body.is_active : req.body.isActive }, { new: true });
    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/access-codes/:id', async (req, res) => {
  try {
    await AccessCode.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/access-codes/:id', async (req, res) => {
  try {
    const code = await AccessCode.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTE: Manage Users (Admin Only)
// ============================================
app.post('/api/manage-users', async (req, res) => {
  try {
    // Auth check
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Admin check
    const admin = await isAdmin(user);
    if (!admin) return res.status(403).json({ error: 'Admin access required' });

    const { action, user_id, role, email, password, name } = req.body;

    if (action === 'list') {
      const users = await User.find().select('-password');
      return res.json({ users });
    }

    if (action === 'add_role') {
      if (!user_id || !role) return res.status(400).json({ error: 'user_id and role required' });
      const targetUser = await User.findById(user_id);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      if (!targetUser.roles.includes(role)) {
        targetUser.roles.push(role);
        await targetUser.save();
      }
      return res.json({ success: true });
    }

    if (action === 'remove_role') {
      if (!user_id || !role) return res.status(400).json({ error: 'user_id and role required' });
      const targetUser = await User.findById(user_id);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      targetUser.roles = targetUser.roles.filter(r => r !== role);
      await targetUser.save();
      return res.json({ success: true });
    }

    if (action === 'create') {
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'User already exists' });
      const newUser = new User({ email, password, name });
      await newUser.save();
      return res.json({ success: true, user: { id: newUser._id, email: newUser.email, name: newUser.name } });
    }

    if (action === 'delete') {
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      await User.findByIdAndDelete(user_id);
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Manage users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Health check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZoyaBites Backend running on http://localhost:${PORT}`);
});
