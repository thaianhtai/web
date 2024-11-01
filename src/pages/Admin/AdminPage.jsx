import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal } from 'bootstrap';
import './admin.css';


const AdminPage = ({ user, openLoginModal }) => {
  const [activeSection, setActiveSection] = useState('user');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [icons, setIcons] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState('');
  const [categoryColor, setCategoryColor] = useState('#ffffff'); // Default color
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    googleId: '', // Mặc định chuỗi trống
    numberphone: '',
    address: '',
    id_role: ''
  });

  const [roles, setRoles] = useState([]); // State cho danh sách vai trò

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/roles');
        setRoles(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách vai trò:', error);
      }
    };

    fetchRoles();
  }, []);

  async function handleAddUser(event) {
    event.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/register/addmin', newUser);
      console.log('Thêm người dùng thành công:', response.data);
      alert('Người dùng đã được thêm thành công!');
      // Xử lý thêm nếu cần, ví dụ: đặt lại form hoặc thông báo thành công
      setNewUser({
        username: '',
        email: '',
        password: '',
        googleId: '',
        numberphone: '',
        address: '',
        id_role: ''
      });
    } catch (error) {
      console.error('Lỗi khi thêm người dùng:', error.response?.data?.message || error.message);
    }
  }

useEffect(() => {
  const fetchIcons = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/icons');
      setIcons(response.data);
    } catch (error) {
      console.error('Error fetching icons:', error);
    }
  };

  fetchIcons();
}, []);
// Fetch categories when component mounts
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  fetchCategories();
}, []);

// Fetch users when activeSection changes to 'user'
useEffect(() => {
  if (activeSection === 'user') {
    axios.get('http://localhost:5000/api/users')
      .then(response => setUsers(response.data))
      .catch(error => console.error('Error fetching users:', error));
  }
}, [activeSection]);

// Fetch products when activeSection changes to 'product'
useEffect(() => {
  if (activeSection === 'product') {
    axios.get('http://localhost:5000/api/productAll')
      .then(response => setProducts(response.data))
      .catch(error => console.error('Error fetching products:', error));
  }
}, [activeSection]);

// Fetch orders when activeSection changes to 'order'
useEffect(() => {
  if (activeSection === 'order') {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/ordersAll', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error.response ? error.response.data : error.message);
      }
    };

    fetchOrders();
  }
}, [activeSection]);

// Handle section switching
const handleSectionSwitch = (section) => {
  setActiveSection(section);
};

// Handle product editing
const handleEditProduct = (product) => {
  setEditProduct(product);
  const editModal = new Modal(document.getElementById('editProductModal'));
  editModal.show();
};

// Handle product deletion
const handleDeleteProduct = async (productId) => {
  try {
    const token = sessionStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    setProducts(products.filter(product => product._id !== productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    alert("Failed to delete product.");
  }
};

// Handle saving categories
const handleSaveCategory = async (e) => {
  e.preventDefault(); // Prevent the default form submission

  const categoryData = {
    category_name: editCategory?.category_name || '', // Use the current category name if editing
    icon: selectedIcon, // Selected icon
    color: editCategory?.color || categoryColor // Use color from editCategory or the current state
  };

  try {
    const token = sessionStorage.getItem('token'); // Get the token from sessionStorage

    // If editing an existing category, make a PUT request
    if (editCategory?._id) {
      const response = await axios.put(`http://localhost:5000/api/categories/${editCategory._id}`, categoryData, {
        headers: {
          Authorization: `Bearer ${token}` // Set the Authorization header
        }
      });

      // Update the categories state with the edited category
      setCategories(categories.map(cat => (cat._id === editCategory._id ? response.data : cat)));
      alert("Cập nhật danh mục thành công!");
    } else {
      // If creating a new category, make a POST request
      const response = await axios.post('http://localhost:5000/api/categories', categoryData, {
        headers: {
          Authorization: `Bearer ${token}` // Set the Authorization header
        }
      });

      // Add the new category to the categories state
      setCategories([...categories, response.data]);
      alert("Thêm danh mục thành công!");
    }

    closeCategoryModal(); // Close the modal
    setEditCategory(null); // Reset the edit category
    setSelectedIcon(''); // Reset the selected icon
    setCategoryColor('#ffffff'); // Reset color to default
  } catch (error) {
    console.error("Error saving category:", error);
    alert("Có lỗi xảy ra khi lưu danh mục.");
  }
};

// Handle opening the edit modal for a category
const handleEditCategory = (category) => {
  setEditCategory({
    ...category, // Spread existing category properties
    color: category.color // Ensure color is also set
  });
  setCategoryColor(category.color); // Set the color state for the color input
  setSelectedIcon(category.icon); // Set the selected icon
  const editModal = new Modal(document.getElementById('editCategoryModal'));
  editModal.show();
};

const handleAddProduct = async (event) => {
  event.preventDefault();
  const formData = new FormData();
  formData.append('product_name', event.target.productName.value);
  formData.append('money', event.target.productPrice.value);
  formData.append('discount_amount', event.target.discountAmount.value);
  formData.append('quantity', event.target.productQuantity.value);
  formData.append('image', event.target.productImage.files[0]);
  formData.append('id_category', selectedCategory);

  try {
    const response = await axios.post('http://localhost:5000/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
      },
    });
    setProducts([...products, response.data]);
    const modalElement = document.getElementById('addProductModal');
    const modalInstance = Modal.getInstance(modalElement);
    modalInstance.hide();
    event.target.reset();
    alert("Thêm sản phẩm thành công!");
  } catch (error) {
    console.error('Error adding product:', error);
    setError(error.response ? error.response.data.message : 'An error occurred while adding the product.');
  }
};

// Handle user deletion
const handleDeleteUser = async (userId) => {
  if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) {
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      setUsers(users.filter(user => user._id !== userId));
      alert("Người dùng đã được xóa thành công!");
    } catch (error) {
      console.error('Error deleting user:', error);
      alert("Đã xảy ra lỗi khi xóa người dùng.");
    }
  }
};

// Handle saving changes to product
const handleSaveChanges = async (event) => {
  event.preventDefault();

  if (!editProduct.id_category) {
    setError('Vui lòng chọn danh mục cho sản phẩm.');
    return;
  }

  const formData = new FormData();
  formData.append('product_name', editProduct.product_name);
  formData.append('money', editProduct.money);
  formData.append('discount_amount', editProduct.discount_amount);
  formData.append('quantity', editProduct.quantity);
  formData.append('id_category', editProduct.id_category);

  if (editProduct.image) {
    formData.append('image', editProduct.image);
  }

  try {
    const response = await axios.put(`http://localhost:5000/api/products/${editProduct._id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
      },
    });

    setProducts(products.map(p => (p._id === response.data._id ? response.data : p)));
    const modal = Modal.getInstance(document.getElementById('editProductModal'));
    modal.hide();
  } catch (error) {
    console.error('Error saving changes:', error);
  }
};

// Fetch categories function (can be used in other parts if needed)
const fetchCategories = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    setCategories(response.data);
  } catch (error) {
    console.error('Error fetching categories:', error.response ? error.response.data : error.message);
  }
};

// Handle opening category modal
const openCategoryModal = (category) => {
  setEditCategory(category);
  setIsCategoryModalOpen(true);
};

// Handle category submission
const handleCategorySubmit = async (event) => {
  event.preventDefault();
  const { categoryName, icon, color } = event.target.elements;

  const categoryData = {
    category_name: categoryName.value,
    icon: icon.value,
    color: color.value,
  };

  try {
    if (editCategory) {
      await axios.put(`http://localhost:5000/api/categories/${editCategory._id}`, categoryData);
      setCategories(categories.map(cat => (cat._id === editCategory._id ? { ...cat, ...categoryData } : cat)));
    } else {
      const response = await axios.post('http://localhost:5000/api/categories', categoryData);
      setCategories([...categories, response.data]);
    }
    setIsCategoryModalOpen(false);
  } catch (error) {
    console.error('Error saving category:', error);
    setError(error.response ? error.response.data.message : 'An error occurred while saving the category.');
  }
};
const handleCategoryChange = (e) => {
  setSelectedCategory(e.target.value); // Update selected category
};
// Handle closing category modal
const closeCategoryModal = () => {
  setEditCategory(null);
  setIsCategoryModalOpen(false);
};

// Handle category deletion
const handleDeleteCategory = async (categoryId) => {
  try {
    const token = sessionStorage.getItem('token'); // Retrieve the JWT token
    const response = await axios.delete(`http://localhost:5000/api/categories/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}` // Set the Authorization header
      }
    });

    // Update the state to remove the deleted category
    setCategories(categories.filter(category => category._id !== categoryId));

  } catch (error) {
    console.error("Error deleting category:", error);
    alert("Có lỗi xảy ra khi xóa danh mục.");
  }
};






// Handle adding a new category
const handleAddCategory = async (event) => {
  event.preventDefault();

  const categoryData = {
    category_name: event.target.categoryName.value,
    icon: selectedIcon,
    color: categoryColor,
  };

  const token = sessionStorage.getItem('token'); // Get the token from sessionStorage

  try {
    const response = await axios.post('http://localhost:5000/api/categories', categoryData, {
      headers: {
        'Authorization': `Bearer ${token}` // Include the token in the headers
      }
    });
    setCategories([...categories, response.data]);
    alert('Danh mục đã được thêm thành công!');
    event.target.reset();
    setSelectedIcon(''); // Reset selected icon
    setCategoryColor('#ffffff'); // Reset color to default
    closeCategoryModal(); // Close modal
  } catch (error) {
    console.error('Error adding category:', error);
    setError('Có lỗi xảy ra khi thêm danh mục.');
  }
};

return (
  <div className="container-fluid mt-4">
    <div className="row">
      <div className="col-md-2 sidebar">
        <div className="sidebar-content">
          <a href="#" className="list-group-item list-group-item-action mb-4" onClick={() => handleSectionSwitch('user')}>
            <i className="bi bi-person"></i> Người dùng
          </a>
          <a href="#" className="list-group-item list-group-item-action mb-4" onClick={() => handleSectionSwitch('product')}>
            <i className="bi bi-box"></i> Sản phẩm
          </a>
          <a href="#" className="list-group-item list-group-item-action mb-4" onClick={() => handleSectionSwitch('order')}>
            <i className="bi bi-cart"></i> Đơn hàng
          </a>
          <a href="#" className="list-group-item list-group-item-action" onClick={() => handleSectionSwitch('category')}>
            <i className="bi bi-list"></i> Danh mục
          </a>
        </div>
      </div>

      <div className="col-md-1 divider"></div>

      {/* User Management Section */}
      {activeSection === 'user' && (
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Thông tin người dùng</h3>
            <button
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#addUserModal"
            >
              Thêm người dùng
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Admin</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td><input type="checkbox" /></td>
                    <td>{user.username}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.address || 'N/A'}</td>
                    <td>{user.id_role?.user_role === 'Admin' ? 'TRUE' : 'FALSE'}</td>
                    <td>{user.numberphone || 'N/A'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Management Section */}
      {activeSection === 'product' && (
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Quản lý sản phẩm</h3>
            <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addProductModal">Thêm</button>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Tên sản phẩm</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Hình ảnh</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td><input type="checkbox" /></td>
                    <td>{product.product_name}</td>
                    <td>{product.money}</td>
                    <td>{product.quantity}</td>
                    <td>
                      <img src={`http://localhost:5000/${product.image}`} alt={product.product_name} style={{ width: '100px', height: 'auto' }} />
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteProduct(product._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEditProduct(product)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Management Section */}
      {activeSection === 'order' && (
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Quản lý đơn hàng</h3>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Tên người mua</th>
                  <th>Số điện thoại</th>
                  <th>Địa chỉ</th>
                  <th>Tên sản phẩm</th>
                  <th>Phí ship</th>
                  <th>Mã đơn hàng</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map(order => (
                  <tr key={order.orderId}>
                    <td><input type="checkbox" /></td>
                    <td>{order.username}</td>
                    <td>{order.phone}</td>
                    <td>{order.address}</td>
                    <td>{order.productName}</td>
                    <td>{order.shippingFee || '0'} VND</td>
                    <td>{order.orderId}</td>
                    <td>{order.price.toLocaleString('vi-VN')} VND</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="text-center">Không có đơn hàng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Management Section */}
      {activeSection === 'category' && (
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Quản lý danh mục</h3>
            <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addCategoryModal">Thêm</button>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Tên danh mục</th>
                  <th>Biểu tượng</th>
                  <th>Màu sắc</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category._id}>
                    <td><input type="checkbox" /></td>
                    <td>{category.category_name}</td>
                    <td>
                      <i className={`bi ${category.icon}`} style={{ fontSize: '2rem', color: category.color }}></i>
                    </td>
                    <td>
                      <div style={{ backgroundColor: category.color, width: '30px', height: '30px', borderRadius: '5px' }}></div>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteCategory(category._id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEditCategory(category)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Add Product Modal */}
    <div className="modal fade" id="addProductModal" tabIndex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="addProductModalLabel">Thêm sản phẩm mới</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form id="addProductForm" onSubmit={handleAddProduct}>
              <div className="mb-3">
                <label htmlFor="productName" className="form-label">Tên sản phẩm</label>
                <input type="text" className="form-control" id="productName" required />
              </div>
              <div className="mb-3">
                <label htmlFor="productPrice" className="form-label">Giá</label>
                <input type="number" className="form-control" id="productPrice" required />
              </div>
              <div className="mb-3">
                <label htmlFor="discountAmount" className="form-label">Giảm giá (%)</label>
                <input type="number" className="form-control" id="discountAmount" min="0" max="100" required />
              </div>
              <div className="mb-3">
                <label htmlFor="productQuantity" className="form-label">Số lượng</label>
                <input type="number" className="form-control" id="productQuantity" required />
              </div>
              <div className="mb-3">
                <label htmlFor="productImage" className="form-label">Hình ảnh</label>
                <input type="file" className="form-control" id="productImage" accept="image/*" required />
              </div>
              <div className="mb-3">
                <label htmlFor="productCategory" className="form-label">Danh mục</label>
                <select
                  className="form-control"
                  id="productCategory"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" form="addProductForm" className="btn btn-primary">Thêm sản phẩm</button>
          </div>
        </div>
      </div>
    </div>

    <div className="modal fade" id="addCategoryModal" tabIndex="-1" aria-labelledby="addCategoryModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="addCategoryModalLabel">Thêm danh mục mới</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form id="addCategoryForm" onSubmit={handleAddCategory}>
              <div className="mb-3">
                <label htmlFor="categoryName" className="form-label">Tên danh mục</label>
                <input type="text" className="form-control" id="categoryName" required />
              </div>
              <div className="mb-3">
                <label htmlFor="categoryIcon" className="form-label">Biểu tượng</label>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                    type="button"
                    id="dropdownMenuButton"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className={`bi ${selectedIcon || 'bi-plus'}`} style={{ marginRight: '5px', fontSize: '1.5rem' }}></i>
                    {selectedIcon ? selectedIcon : 'Chọn biểu tượng'}
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    {icons.map((icon) => (
                      <li key={icon} className="dropdown-item d-flex align-items-center" onClick={() => setSelectedIcon(icon)}>
                        <i className={`bi ${icon}`} style={{ marginRight: '10px', fontSize: '1.5rem' }}></i>
                        {icon}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="categoryColor" className="form-label">Màu sắc</label>
                <input
                  type="color"
                  className="form-control"
                  id="categoryColor"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)} // Ensure you have state to handle this
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" form="addCategoryForm" className="btn btn-primary">Thêm danh mục</button>
          </div>
        </div>
      </div>
    </div>

    {/* Edit Product Modal */}
    <div className="modal fade" id="editProductModal" tabIndex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="editProductModalLabel">Chỉnh sửa sản phẩm</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form id="editProductForm" onSubmit={handleSaveChanges}>
              <div className="mb-3">
                <label htmlFor="editProductName" className="form-label">Tên sản phẩm</label>
                <input
                  type="text"
                  className="form-control"
                  id="editProductName"
                  value={editProduct?.product_name || ''}
                  required
                  onChange={(e) => setEditProduct({ ...editProduct, product_name: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editProductPrice" className="form-label">Giá</label>
                <input
                  type="number"
                  className="form-control"
                  id="editProductPrice"
                  value={editProduct?.money || ''}
                  required
                  onChange={(e) => setEditProduct({ ...editProduct, money: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editProductQuantity" className="form-label">Số lượng</label>
                <input
                  type="number"
                  className="form-control"
                  id="editProductQuantity"
                  value={editProduct?.quantity || ''}
                  required
                  onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editProductCategory" className="form-label">Danh mục</label>
                <select
                  className="form-control"
                  id="editProductCategory"
                  value={editProduct?.id_category || ''}
                  required
                  onChange={(e) => setEditProduct({ ...editProduct, id_category: e.target.value })}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="editProductImage" className="form-label">Hình ảnh</label>
                <input
                  type="file"
                  className="form-control"
                  id="editProductImage"
                  accept="image/*"
                  onChange={(e) => setEditProduct({ ...editProduct, image: e.target.files[0] })}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" form="editProductForm" className="btn btn-primary">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>

    {/* Edit Category Modal */}
    <div className="modal fade" id="editCategoryModal" tabIndex="-1" aria-labelledby="editCategoryModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="editCategoryModalLabel">Chỉnh sửa danh mục</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form id="editCategoryForm" onSubmit={handleSaveCategory}>
              <div className="mb-3">
                <label htmlFor="editCategoryName" className="form-label">Tên danh mục</label>
                <input
                  type="text"
                  className="form-control"
                  id="editCategoryName"
                  value={editCategory?.category_name || ''}
                  required
                  onChange={(e) => setEditCategory({ ...editCategory, category_name: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editCategoryIcon" className="form-label">Biểu tượng</label>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                    type="button"
                    id="dropdownMenuButton"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className={`bi ${selectedIcon || 'bi-plus'}`} style={{ marginRight: '5px', fontSize: '1.5rem' }}></i>
                    {selectedIcon ? selectedIcon : 'Select an icon'}
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    {icons.map((icon) => (
                      <li key={icon} className="dropdown-item d-flex align-items-center" onClick={() => setSelectedIcon(icon)}>
                        <i className={`bi ${icon}`} style={{ marginRight: '10px', fontSize: '1.5rem' }}></i>
                        {icon}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="editCategoryColor" className="form-label">Màu sắc</label>
                <input
                  type="color"
                  className="form-control"
                  id="editCategoryColor"
                  value={editCategory?.color} // Use editCategory.color directly
                  onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })} // Update state with selected color
                />
              </div>
            </form>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" form="editCategoryForm" className="btn btn-primary">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>




    <div className="modal fade" id="addUserModal" tabIndex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="addUserModalLabel">Thêm người dùng mới</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form id="addUserForm" onSubmit={handleAddUser}>

              <div className="mb-3">
                <label htmlFor="addUsername" className="form-label">Tên người dùng</label>
                <input
                  type="text"
                  className="form-control"
                  id="addUsername"
                  required
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>


              <div className="mb-3">
                <label htmlFor="addEmail" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="addEmail"
                  required
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>


              <div className="mb-3">
                <label htmlFor="addPassword" className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  id="addPassword"
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>


              <div className="mb-3">
                <label htmlFor="addRole" className="form-label">Vai trò</label>
                <select
                  className="form-control"
                  id="addRole"
                  value={newUser.id_role || ''} // Giá trị vai trò đã chọn
                  onChange={(e) => setNewUser({ ...newUser, id_role: e.target.value })} // Cập nhật vai trò trong newUser
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.user_role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="addNumberphone" className="form-label">Số điện thoại</label>
                <input
                  type="text"
                  className="form-control"
                  id="addNumberphone"
                  onChange={(e) => setNewUser({ ...newUser, numberphone: e.target.value })}
                />
              </div>


              <div className="mb-3">
                <label htmlFor="addAddress" className="form-label">Địa chỉ</label>
                <input
                  type="text"
                  className="form-control"
                  id="addAddress"
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" form="addUserForm" className="btn btn-primary">Thêm người dùng</button>
          </div>
        </div>
      </div>
    </div>

    
  </div>
);
};

export default AdminPage;

