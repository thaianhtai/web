import React, { useEffect, useState } from "react";
import './cart.css';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); // State to store user information
    const [notification, setNotification] = useState(''); // State for notifications
    const shippingFee = 0; // Phí giao hàng
    const discount = 0; // Giảm giá

    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/cart', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setCartItems(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch cart items:', error);
                setCartItems([]);
            } finally {
                setLoading(false);
            }
        };

        const fetchUser = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/user', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const userData = await response.json();
                setUser(userData);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };

        fetchCartItems();
        fetchUser(); // Fetch user information on component mount
    }, []);

    const handleQuantityChange = (id, newQuantity) => {
        const item = cartItems.find(item => item._id === id);
        if (!item) return;

        if (newQuantity < 1) return; // Prevent decreasing below 1
        if (newQuantity > item.product_quantity) {
            alert(`Số lượng không đủ. Chỉ còn ${item.product_quantity} sản phẩm trong kho.`);
            return;
        }

        // Update the cart item quantity
        const updatedCartItems = cartItems.map(item => {
            if (item._id === id) {
                return { ...item, quantity: newQuantity };
            }
            return item;
        });

        setCartItems(updatedCartItems); // Update cart state
    };

    const totalPrice = cartItems.reduce((total, item) => {
        return total + (item.product_price * item.quantity);
    }, 0) - discount + shippingFee;

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/cart/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete item from cart');
            }

            setCartItems(cartItems.filter(item => item._id !== id));
        } catch (error) {
            console.error('Error deleting cart item:', error);
        }
    };

    const handleCheckout = async () => {
        if (!user || !user.username || !user.email || !user.address || !user.numberphone) {
            setNotification('Vui lòng cập nhật đầy đủ thông tin cá nhân trước khi thanh toán.');
            return; // Exit if user info is not complete
        }

        const checkoutData = {
            id_product: cartItems.map(item => item.product_id),
            quantity: cartItems.map(item => item.quantity),
            totalAmount: totalPrice,
        };

        try {
            const response = await fetch('http://localhost:5000/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify(checkoutData),
            });

            if (!response.ok) {
                throw new Error('Failed to process payment');
            }

            const data = await response.json();
            console.log('Payment successful:', data);
            window.location.href = data.payUrl; // Redirect to MoMo payment page
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Checkout failed: ' + error.message);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-4">
            {notification && (
                <div className="alert alert-warning" role="alert">
                    {notification}
                </div>
            )}
            <h2 className="cart-header">Giỏ hàng</h2>
            <div className="row">
                <div className="col-md-8">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Đơn giá</th>
                                <th style={{ width: '180px' }}>Số lượng</th>
                                <th>Thành tiền</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.length > 0 ? (
                                cartItems.map((item) => (
                                    <tr key={item._id}>
                                        <td>{item.product_name}</td>
                                        <td>{item.product_price.toLocaleString('vi-VN')} VNĐ</td>
                                        <td>
                                            <div className="input-group">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={item.quantity}
                                                    min="1"
                                                    readOnly
                                                />
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>{(item.product_price * item.quantity).toLocaleString('vi-VN')} VNĐ</strong>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-danger btn-sm" 
                                                title="Xóa"
                                                onClick={() => handleDelete(item._id)} 
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">Giỏ hàng rỗng</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="col-md-4">
                    <div className="total-section">
                        <h5>Tổng tiền</h5>
                        <p>Tạm tính: <strong>{totalPrice.toLocaleString('vi-VN')} VNĐ</strong></p>
                        <p>Giảm giá: <strong>{discount.toLocaleString('vi-VN')} VNĐ</strong></p>
                        <p>Phí giao hàng: <strong>{shippingFee.toLocaleString('vi-VN')} VNĐ</strong></p>
                        <h5><strong>Tổng cộng: {totalPrice.toLocaleString('vi-VN')} VNĐ</strong></h5>
                        <button className="btn btn-danger w-100" onClick={handleCheckout}>Mua hàng</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
