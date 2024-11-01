const express = require('express');

const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const { Schema } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Đảm bảo đã import ở đây
const querystring = require('querystring');
const multer = require('multer');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const url = require('url');
// Middleware to parse JSON and URL-encoded bodies

// Initialize app and Google OAuth2 client
const app = express();
const server = http.createServer(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const io = socketIO(server, {
  cors: {
    rigin: ["http://localhost:3000", "http://localhost:3001"], // Allow requests from the frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true
  },
});

// Google OAuth client
const googleClient = new OAuth2Client('987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com'); // Thay thế với Google Client ID

// Middleware setup
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // Thêm cổng 3001 vào danh sách
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: true
}));


// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Session middleware setup
app.use(session({
  secret: 'your_session_secret1234567', 
  resave: false,
  saveUninitialized: true,
}));

// JWT secret key
const JWT_SECRET = 'your_jwt_secret_key1234567';

// MongoDB Schemas
const roleSchema = new Schema({
  user_role: { type: String, required: true },
});
const Role = mongoose.model('Role', roleSchema);

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  id_role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: new mongoose.Types.ObjectId('671227f7e063ea605542e74b'), // Default role ID
  },
  numberphone: { type: String },
  address: { type: String },
});
userSchema.plugin(AutoIncrement, { inc_field: 'id' });
const User = mongoose.model('User', userSchema);


const categorySchema = new Schema({
  category_name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
});
const Category = mongoose.model('Category', categorySchema);

const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true },
  money: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  image: { type: String, required: true },
  id_category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isDeleted: { type: Boolean, default: false } // New field for deleted status
});

// Tạo text index cho trường `product_name`
productSchema.index({ product_name: 'text' });

const Product = mongoose.model('Product', productSchema);


const cartSchema = new Schema({
  id_product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true, min: 1 },
});
const Cart = mongoose.model('Cart', cartSchema);

const checkoutSchema = new mongoose.Schema({
  id_product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
  date_checkout: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  quantity: { type: Number, required: true },
  orderId: { type: String, required: true } // New field for orderId
});

const Checkout = mongoose.model('Checkout', checkoutSchema);
module.exports = Checkout;
// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); 
  },
});
const upload = multer({ storage: storage });

// Helper function to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Token is required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Google OAuth Authentication Route
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: '987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com', 
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'];

    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        username: payload['name'],
        email: payload['email'],
        googleId,
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Google login failed.' });
  }
});

// Standard login route (email/password)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('id_role');
    if (!user) {
      console.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`Invalid password attempt for email: ${email}`);
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.id_role.user_role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.id_role.user_role,
        numberphone: user.numberphone,
        address: user.address
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// API to get all roles
app.get('/api/roles', async (req, res) => {
  try {
    // Lấy tất cả các vai trò từ MongoDB
    const roles = await Role.find();
    res.status(200).json(roles); // Trả về danh sách vai trò dưới dạng JSON
  } catch (error) {
    console.error('Error fetching roles:', error); // Log lỗi để kiểm tra
    res.status(500).json({ message: 'Internal server error' });
  }
});
// API đăng ký người dùng mới
app.post('/api/register/addmin', async (req, res) => {
  try {
    const { username, email, password, numberphone, address, id_role } = req.body;

    // Kiểm tra nếu email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng.' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo đối tượng người dùng mới
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      googleId: '', // Mặc định là chuỗi trống
      numberphone,
      address,
      id_role
    });

    // Lưu người dùng mới vào database
    const savedUser = await newUser.save();

    // Trả về thông tin người dùng mới
    res.status(201).json({
      message: 'Người dùng đã được thêm thành công!',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        numberphone: savedUser.numberphone,
        address: savedUser.address,
        id_role: savedUser.id_role
      }
    });
  } catch (error) {
    console.error('Lỗi khi thêm người dùng:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi server.' });
  }
});


// Registration API
app.post('/api/register', async (req, res) => {
  try {
      const { username, email, password, numberphone, address } = req.body;
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
          return res.status(400).json({ message: 'Username or email already exists.' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
          username,
          email,
          password: hashedPassword,
          numberphone,
          address,
      });

      const savedUser = await user.save();

      // Generate a JWT token
      const token = jwt.sign(
          { id: savedUser._id, username: savedUser.username },
          JWT_SECRET,
          { expiresIn: '1h' }
      );

      res.status(201).json({
          token,
          user: {
              id: savedUser._id,
              username: savedUser.username,
              email: savedUser.email,
              numberphone: savedUser.numberphone,
              address: savedUser.address,
          },
          message: 'Registration successful!'
      });
  } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: error.message });
  }
});
app.get('/api/productAll', async (req, res) => {
  try {
  
    const products = await Product.find({ isDeleted: false }).populate('id_category');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error); 
    res.status(500).json({ message: 'Internal server error' });
  }
}); 

// API to get all products
app.get('/api/products', async (req, res) => {
  try {
      const { page = 1, limit = 10, sortBy = 'price', order = 'asc' } = req.query;

      // Convert pagination parameters to numbers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const sortOrder = order === 'asc' ? 1 : -1; // MongoDB sort order

      // Find products
      const products = await Product.find({ isDeleted: false })
          .populate('id_category')
          .sort({ [sortBy]: sortOrder }) // Sort by the specified field
          .skip((pageNumber - 1) * limitNumber) // Pagination
          .limit(limitNumber); // Limit results

      // Get total count of products
      const totalCount = await Product.countDocuments({ isDeleted: false });

      // Respond with products and metadata
      res.status(200).json({
          totalCount,
          page: pageNumber,
          limit: limitNumber,
          products,
      });
  } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});



// API to add new product
app.post('/api/products', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const { product_name, money, discount_amount, quantity, id_category } = req.body;

    // Check if the product name already exists and is not deleted
    const existingProduct = await Product.findOne({ product_name, isDeleted: false });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product already exists and is active.' });
    }

    // Check if the specified category exists
    const category = await Category.findById(id_category);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Create a new product
    const product = new Product({
      product_name,
      money,
      discount_amount: discount_amount || 0,
      quantity,
      image: req.file.path,
      id_category,
      isDeleted: false // Ensure the new product is not marked as deleted
    });

    // Save the new product to the database
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error adding product:', error); // Log error for debugging
    res.status(500).json({ message: error.message });
  }
});


// API to update a product
app.put('/api/products/:id', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, money, discount_amount, quantity, id_category } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.product_name = product_name;
    product.money = money;
    product.discount_amount = discount_amount || 0;
    product.quantity = quantity;
    product.id_category = id_category;

    if (req.file) {
      product.image = req.file.path;
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Add a new category
app.post('/api/categories', authenticateJWT, async (req, res) => {
  try {
    const { category_name, icon, color } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ category_name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create a new category
    const category = new Category({
      category_name,
      icon,
      color,
    });

    // Save the new category
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error });
  }
});

// API to get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// API to get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('id_role', 'user_role');
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user API
app.delete('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
      const { id } = req.params;
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Delete related data (cart and checkout)
      await Cart.deleteMany({ id_user: id });
      await Checkout.deleteMany({ id_user: id });

      // Delete user
      await User.findByIdAndDelete(id);

      res.status(200).json({ message: 'User and related data deleted successfully' });
  } catch (error) {
      console.error('Error deleting user:', error); // Log the error for debugging
      res.status(500).json({ message: 'Internal server error' });
  }
});

// API to get product details by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    // Find the product by ID and ensure it is not marked as deleted
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or has been deleted' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error); // Log the error for debugging
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/products/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Mark the product as deleted
    product.isDeleted = true;
    await product.save();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// API for adding product to cart
app.post('/api/cart', authenticateJWT, async (req, res) => {
  try {
    const { id_product, quantity } = req.body;

    // Check if the product exists and get its available quantity
    const product = await Product.findById(id_product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the requested quantity exceeds the available quantity
    if (quantity > product.quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    // Proceed to create the cart item
    const cartItem = new Cart({
      id_product,
      id_user: req.user.id,
      quantity,
    });
    await cartItem.save();

    // Update the product's quantity
    product.quantity -= quantity;
    await product.save();

    // Emit the updated cart count
    const cartCount = await Cart.countDocuments({ id_user: req.user.id });
    io.emit('cartCountUpdated', cartCount); // Notify all clients
    res.status(201).json(cartItem);
  } catch (error) {
    console.error("Failed to add item to cart:", error); // Log error for debugging
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});
// API to delete a cart item
app.delete('/api/cart/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params; // Get the cart item ID from the URL

    // Find and delete the cart item
    const cartItem = await Cart.findOneAndDelete({ _id: id, id_user: req.user.id });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Find the associated product
    const product = await Product.findById(cartItem.id_product);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increase the product's quantity based on the quantity in the cart
    product.quantity += cartItem.quantity;

    // Save the updated product
    await product.save();

    res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ message: 'Failed to delete cart item' });
  }
});

// API to get products by category ID
app.get('/api/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params; // Get the category ID from the URL

    // Find products by category ID and ensure they are not marked as deleted
    const products = await Product.find({ id_category: categoryId, isDeleted: false })
      .populate('id_category');

    // Return an empty array if no products are found
    if (!products || products.length === 0) {
      console.warn(`No products found for category ID: ${categoryId}`);
      return res.status(200).json([]); // Return an empty array instead of 404
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Failed to fetch products by category' });
  }
});








// API to fetch items in the cart
// API to fetch items in the cart
app.get('/api/cart', authenticateJWT, async (req, res) => {
  try {
      const cartItems = await Cart.find({ id_user: req.user.id })
          .populate('id_product', 'product_name money quantity image') // Include available quantity
          .exec();

      const populatedCartItems = cartItems.map(item => ({
          _id: item._id,
          product_id: item.id_product._id,
          product_name: item.id_product.product_name,
          product_price: item.id_product.money,
          product_image: item.id_product.image,
          quantity: item.quantity,
          product_quantity: item.id_product.quantity // Add this line to get available stock
      }));

      res.status(200).json(populatedCartItems);
  } catch (error) {
      console.error('Failed to fetch cart items:', error);
      res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});

app.post('/api/payment', authenticateJWT, async (req, res) => {
  try {
      // Retrieve cart items for the authenticated user
      const cartItems = await Cart.find({ id_user: req.user.id }).populate('id_product');

      if (!cartItems || cartItems.length === 0) {
          return res.status(400).json({ message: 'Cart is empty, cannot proceed to payment.' });
      }

      // Fetch the user's information to check completeness
      const user = await User.findById(req.user.id);
      if (!user || !user.username || !user.email || !user.address || !user.numberphone) {
          return res.status(400).json({ message: 'Please update your profile with complete information before proceeding to payment.' });
      }

      // Calculate the total amount from cart items
      const totalAmount = cartItems.reduce((total, item) => {
          return total + (item.id_product.money * item.quantity);
      }, 0);

      // MoMo payment parameters
      const accessKey = 'F8BBA842ECF85';
      const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const orderInfo = 'pay with MoMo';
      const partnerCode = 'MOMO';
      const redirectUrl = 'http://localhost:3000/cart'; // Adjust as needed
      const ipnUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
      const requestType = "payWithMethod";
      const amount = totalAmount.toString();
      const orderId = partnerCode + new Date().getTime(); // Unique order ID
      const requestId = orderId; // Use orderId as requestId
      const extraData = '';
      const autoCapture = true;
      const lang = 'vi';

      // Create raw signature for HMAC SHA256
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      // Generate signature
      const signature = crypto.createHmac('sha256', secretKey)
          .update(rawSignature)
          .digest('hex');

      // JSON object to send to MoMo endpoint
      const requestBody = JSON.stringify({
          partnerCode: partnerCode,
          partnerName: "Test",
          storeId: "MomoTestStore",
          requestId: requestId,
          amount: amount,
          orderId: orderId,
          orderInfo: orderInfo,
          redirectUrl: redirectUrl,
          ipnUrl: ipnUrl,
          lang: lang,
          requestType: requestType,
          autoCapture: autoCapture,
          extraData: extraData,
          signature: signature
      });

      // Option for axios
      const options = {
          method: "POST",
          url: "https://test-payment.momo.vn/v2/gateway/api/create",
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(requestBody)
          },
          data: requestBody
      };

      let result = await axios(options);
      console.log("Payment response:", result.data);

      // Check for successful payment response
      if (result.data && result.data.resultCode === 0) {
          // Save checkout information for each product in the cart
          const checkoutRecords = cartItems.map(item => ({
              id_product: item.id_product._id,
              id_user: req.user.id,
              amount: item.id_product.money,
              quantity: item.quantity,
              status: 'completed',
              orderId: orderId // Add orderId here
          }));

          // Use insertMany for better performance
          await Checkout.insertMany(checkoutRecords);

          // Delete cart items after successful checkout
          await Cart.deleteMany({ id_user: req.user.id });

          // Redirect the user to the payment URL
          return res.status(200).json({ payUrl: result.data.payUrl });
      } else {
          return res.status(400).json({ message: 'Payment failed', data: result.data });
      }
  } catch (error) {
      console.error("Error during payment request:", error);
      return res.status(500).json({
          statusCode: 500,
          message: 'Server error'
      });
  }
});

app.get('/api/orders', authenticateJWT, async (req, res) => {
  try {
    const checkouts = await Checkout.find({ id_user: req.user.id })
      .populate('id_product') // Optionally populate product details
      .exec();
      
    if (!checkouts || checkouts.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }

    // Format the data to return the relevant fields
    const orderHistory = checkouts.map(order => ({
      orderId: order.orderId,
      productName: order.id_product.product_name,
      quantity: order.quantity,
      price: order.amount,
      status: order.status,
      paymentDate: order.date_checkout
    }));

    res.status(200).json(orderHistory);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/ordersAll', authenticateJWT, async (req, res) => {
  try {
      const checkouts = await Checkout.find({})
          .populate('id_product')
          .populate({
              path: 'id_user',
              select: 'username numberphone address'
          })
          .exec();

      if (!checkouts || checkouts.length === 0) {
          return res.status(404).json({ message: 'No orders found.' });
      }

      const orderHistory = checkouts.map(order => ({
          orderId: order.orderId,
          username: order.id_user.username,
          phone: order.id_user.numberphone,
          address: order.id_user.address,
          productName: order.id_product.product_name,
          quantity: order.quantity,
          price: order.amount,
          status: order.status,
          paymentDate: order.date_checkout
      }));

      res.status(200).json(orderHistory);
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});



// Get user details
app.get('/api/user', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      username: user.username,
      email: user.email,
      address: user.address,
      numberphone: user.numberphone
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user details
app.put('/api/user', authenticateJWT, async (req, res) => {
  try {
    const { username, email, address, numberphone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, {
      username,
      email,
      address,
      numberphone
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/api/search', async (req, res) => {
  const searchTerm = req.query.search || '';  // Lấy từ khóa tìm kiếm từ query parameters
  console.log(`Searching products with term: "${searchTerm}"`);

  try {
    if (!searchTerm.trim()) {
      return res.status(400).json({ message: 'Search term cannot be empty' });
    }

    // Sử dụng tìm kiếm với $regex cho phép tìm chuỗi có chứa từ khóa
    const products = await Product.find({
      product_name: { $regex: searchTerm, $options: 'i' },  // Tìm kiếm theo từ khóa không phân biệt chữ hoa/thường
      isDeleted: false  // Chỉ lấy sản phẩm chưa bị xóa
    });

    // Kiểm tra nếu không có sản phẩm nào được tìm thấy, trả về mảng rỗng
    if (products.length === 0) {
      console.log('No products found');
      return res.status(200).json([]);  // Trả về mảng rỗng nếu không có sản phẩm
    }

    console.log(`Found ${products.length} products for term: "${searchTerm}"`);
    res.status(200).json(products);  // Trả về danh sách sản phẩm tìm thấy
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/api/search/suggestions', async (req, res) => {
  const searchTerm = req.query.query || '';  // Lấy từ khóa từ query parameters

  console.log(`Received search term: "${searchTerm}"`);  // Log để kiểm tra giá trị từ client

  try {
    // Nếu từ khóa trống, trả về mảng rỗng
    if (!searchTerm.trim()) {
      return res.status(200).json([]);
    }

    // Tìm kiếm sản phẩm có tên chứa từ khóa (không phân biệt chữ hoa/thường)
    const suggestions = await Product.find({
      product_name: { $regex: searchTerm, $options: 'i' },  // Tìm kiếm với regex
      isDeleted: false  // Chỉ lấy sản phẩm chưa bị xóa
    })
    .limit(10)  // Giới hạn số lượng gợi ý trả về
    .select('product_name');  // Chỉ lấy trường product_name

    // Kiểm tra xem có sản phẩm nào khớp không
    if (suggestions.length === 0) {
      console.log('No products found for search term:', searchTerm);
    } else {
      console.log(`Found ${suggestions.length} products for term: "${searchTerm}"`);
    }

    // Trả về danh sách tên sản phẩm làm gợi ý
    const suggestionNames = suggestions.map(product => product.product_name);
    res.status(200).json(suggestionNames);  // Trả về mảng tên sản phẩm

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API to update a category

//api icon
app.get('/api/icons', async (req, res) => {
  try {
    // Lấy CSS chứa các lớp biểu tượng từ Bootstrap Icons
    const { data } = await axios.get('https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css');
    
    // Regex để tìm các tên lớp biểu tượng
    const iconRegex = /\.bi-([a-zA-Z0-9-]+)/g;
    const icons = [];

    let match;
    // Lặp qua tất cả các biểu tượng tìm thấy và thêm vào mảng icons
    while ((match = iconRegex.exec(data)) !== null) {
      icons.push(`bi-${match[1]}`); // Thêm tên lớp biểu tượng
    }

    // Thêm biểu tượng máy tính, tivi và máy ảnh vào danh sách
    icons.push('bi-laptop');
    icons.push('bi-tv');
    icons.push('bi-camera'); // Thêm biểu tượng máy ảnh vào đây

    // Gửi danh sách biểu tượng dưới dạng phản hồi
    res.status(200).json(icons);
  } catch (error) {
    console.error('Error fetching icons:', error);
    res.status(500).json({ message: 'Failed to fetch icons' });
  }
});

app.put('/api/categories/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params; // Get the category ID from the URL
    const { category_name, icon, color } = req.body; // Get new category details from request body

    // Check if the category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update category details only if new values are provided
    if (category_name) category.category_name = category_name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    const updatedCategory = await category.save(); // Save the updated category

    res.status(200).json(updatedCategory); // Respond with the updated category
  } catch (error) {
    console.error('Error updating category:', error); // Log error for debugging
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.delete('/api/categories/:id', authenticateJWT, async (req, res) => {
  try {
      const { id } = req.params; // Get the category ID from the URL

      // Check if the category exists
      const category = await Category.findById(id);
      if (!category) {
          return res.status(404).json({ message: 'Category not found' });
      }

      // Delete the category
      await Category.findByIdAndDelete(id);
      res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
