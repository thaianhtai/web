import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./details.css";

const ProductsPage = ({ user, openLoginModal }) => {
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // New state for error messages
 
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get("id");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/products/${productId}`);
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Product not found for ID:", productId);
        setError("Product not found."); // Set error message
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleAddToCart = async () => {
    if (!user) {
      openLoginModal(); // Trigger the login modal if the user is not logged in
    } else {
      try {
        const token = sessionStorage.getItem('token');

        const response = await axios.post(
          'http://localhost:5000/api/cart',
          {
            id_product: product._id,
            quantity: quantity,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('Product added to cart:', response.data);
        alert('Product added to cart successfully!');
        setError(""); // Clear any previous errors
      } catch (error) {
        console.error('Failed to add product to cart:', error);
        setError('Không đủ sản phẩm.'); // Set error message
      }
    }
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/">Trang chủ</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Chi tiết sản phẩm
          </li>
        </ol>
      </nav>

      {/* Display error message */}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
      <div className="col-md-5">
  <img
    src={`http://localhost:5000/${product.image}`}
    alt={product.product_name}
    style={{
      width: '100%',      // Make the image fill the width of the parent
      height: '500px',    // Set a fixed height
      objectFit: 'cover', // Maintain aspect ratio and cover the area
      display: 'block'     // Remove bottom gap in some browsers
    }}
  />
</div>


        <div className="col-md-7">
          <div className="product-info">
            <h1 className="product-title">{product.product_name}</h1>
            <div className="product-price mt-2">{product.money} VND</div>
            <div className="quantity-selector mt-4 d-flex align-items-center">
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(quantity - 1)} disabled={quantity <= 1}>-</button>
              <input type="text" value={quantity} className="form-control mx-2" readOnly />
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>

            <div className="product-buttons mt-4 d-flex" style={{ justifyContent: 'flex-end', width: '50%' }}>
  <button
    className="btn btn-danger"
    onClick={() => handleAddToCart()}
    style={{
      fontSize: '12px', // Kích thước chữ
      padding: '5px 10px', // Padding trên/dưới và trái/phải
      width: '150px', // Chiều dài cho nút (bạn có thể điều chỉnh giá trị này)
      borderRadius: '4px', // Độ cong của nút (tuỳ chọn)
    }}
  >
    Chọn mua
  </button>
</div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
