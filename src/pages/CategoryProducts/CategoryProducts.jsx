import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom"; // Correct import
import '../HomePage/home.css';

const CategoryProducts = () => {
  const [categories, setCategories] = useState([]); // State for categories
  const [products, setProducts] = useState([]); // State for products
  const [loading, setLoading] = useState(true); // Add loading state to handle loading status

  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id'); // Correctly extract the 'id' parameter from URL

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        setCategories(response.data);
      } catch (error) {
        setProducts([]);
        console.error('Failed to fetch categories', error);
       
        
      }
    };

    fetchCategories(); // Fetch categories on component mount
  }, []);

  // Fetch products by category
  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        setLoading(true); // Set loading to true while fetching
        const response = await axios.get(`http://localhost:5000/api/products/category/${categoryId}`); // Fetch products by category ID
        setProducts(response.data);
        setLoading(false); // Turn off loading when data is fetched
      } catch (error) {
        console.error('Failed to fetch products', error);
        setLoading(false); // Turn off loading in case of an error
      }
    };

    if (categoryId) {
      fetchProductsByCategory(); // Fetch products if categoryId is available
    }
  }, [categoryId]); // Trigger useEffect when categoryId changes

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Left Column: Category List */}
        <div className="col-md-3">
  <div className="category-list p-3 bg-light rounded shadow-sm">
    <h5 className="category-title text-center mb-3 fw-bold">Danh mục</h5>
    <ul className="list-group">
      {categories.map((category, index) => (
        <li className="d-flex align-items-center border-0 mb-2" key={index}>
          <Link to={`/category?id=${category._id}`} className="text-decoration-none"> {/* Disable underline */}
            <i className={`bi ${category.icon} me-2`} style={{ color: category.color }}></i>
            <span>{category.category_name}</span>
          </Link>
        </li>
      ))}
       <li className="d-flex align-items-center border-0 mb-2" >
                                    <Link to={`/`} className="text-decoration-none">
                                        <i className={`bi me-2`} ></i>
                                        <span>Tất cả</span>
                                    </Link>
                                </li>
    </ul>
  </div>
</div>


        {/* Right Column: Carousel and Product Cards */}
        <div className="col-md-9">
          {/* Carousel Slider */}
          <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-indicators">
              <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
              <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
            </div>
            <div className="carousel-inner">
              <div className="carousel-item active">
                <div className="d-flex justify-content-between">
                  <img src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_58a281730e.png" className="d-block w-50 custom-image" alt="Slide 1" />
                  <img src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_e987312907.png" className="d-block w-50 custom-image" alt="Slide 2" />
                </div>
              </div>
              <div className="carousel-item">
                <div className="d-flex justify-content-between">
                  <img src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_58a281730e.png" className="d-block w-50 custom-image" alt="Slide 3" />
                  <img src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_58a281730e.png" className="d-block w-50 custom-image" alt="Slide 4" />
                </div>
              </div>
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>

          {/* Product Cards */}
          <div className="container mt-4">
            <div className="row">
              {/* Product Cards */}
              {loading ? (
                <div>Loading products...</div>
              ) : (
                <div className="row mt-4">
      {products.map((product) => (
        <div className="col-md-3 mb-4" key={product._id}> {/* Sử dụng _id thay vì id */}
          <div className="card product-card">
            <img
              src={`http://localhost:5000/${product.image}`} // Đường dẫn ảnh từ server
              className="card-img-top"
              alt={product.product_name} // Sử dụng product_name thay vì title
            />
            <div className="card-body">
              <Link to={`/detailsProduct?id=${product._id}`}> {/* Liên kết đến chi tiết sản phẩm */}
                <h6 className="card-title">{product.product_name}</h6> {/* Hiển thị tên sản phẩm */}
              </Link>
              <div className="d-flex">
                <div className="rating text-warning me-2">★★★★★</div> {/* Tạm thời gán đánh giá 5 sao */}
              </div>
              <p className="product-price mt-2">{product.money} VND</p> {/* Giá tiền hiện tại */}
              {product.discount_amount > 0 && ( /* Hiển thị giá cũ và giảm giá nếu có */
                <>
                  {/* Tính giá cũ dựa trên tỷ lệ phần trăm giảm giá */}
                  <p className="old-price">
                    {(product.money / (1 - product.discount_amount / 100)).toFixed(0)} VND
                  </p>
                  <p className="text-danger">-{product.discount_amount}%</p>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryProducts;
