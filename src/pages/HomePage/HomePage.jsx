import React, { useState, useEffect } from "react";
import axios from "axios";
import './home.css';
import { Link } from "react-router-dom";

const HomePage = () => {
    const [categories, setCategories] = useState([]); // State for categories
    const [products, setProducts] = useState([]); // State for products
    const [topProducts, setTopProducts] = useState([]); // State for filtered top products
    const [filter, setFilter] = useState(''); // State for filter selection

    useEffect(() => {
      const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/products'); // Fetch all products
            console.log('Fetched Products:', response.data); // Log the data structure
            // Extract the products array from the response
            setProducts(response.data.products); // Set products in state to the array
            setTopProducts(response.data.products); // Initialize top products with all products
        } catch (error) {
            console.error('Failed to fetch products', error);
            setProducts([]); // Reset products on error
            setTopProducts([]); // Reset top products on error
        }
    };

        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/categories'); // Fetch categories
                setCategories(response.data); // Set categories in state
            } catch (error) {
                console.error('Failed to fetch categories', error);
            }
        };

        fetchProducts(); // Call API on component mount
        fetchCategories(); // Fetch categories on mount
    }, []); // Empty dependency array to run once on mount

    const handleFilter = (event) => {
      const selectedFilter = event.target.value;
      setFilter(selectedFilter);
  
      // Check if products is an array
      if (!Array.isArray(products)) {
          console.error('Products is not iterable:', products);
          return; // Exit if products is not an array
      }
  
      let sortedProducts;
      if (selectedFilter === 'topAsc') {
          sortedProducts = [...products].sort((a, b) => a.money - b.money);
          setTopProducts(sortedProducts.slice(0, 10)); // Top 10 lowest priced products
      } else if (selectedFilter === 'topDesc') {
          sortedProducts = [...products].sort((a, b) => b.money - a.money);
          setTopProducts(sortedProducts.slice(0, 10)); // Top 10 highest priced products
      } else {
          setTopProducts(products); // Reset to all products if no filter
      }
  };

    return (
        <div className="container mt-4">
            <div className="row">
                {/* Left Column: Category List */}
                <div className="col-md-3">
                    <div className="category-list p-3 bg-light rounded shadow-sm">
                        <h5 className="category-title text-center mb-3 fw-bold">Danh mục</h5>
                        <ul className="list-group">
                            {categories.map((category) => (
                                <li className="d-flex align-items-center border-0 mb-2" key={category._id}>
                                    <Link to={`/category?id=${category._id}`} className="text-decoration-none">
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

                    {/* Icon Menu */}
                    <div id="carouselExampleIndicators2" className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            <div className="carousel-item active">
                                <div className="icon-menu d-flex justify-content-between align-items-center flex-wrap mt-4">
                                    {categories.slice(0, 5).map((category) => (
                                        <Link to={`/category?id=${category._id}`} key={category._id} className="text-center">
                                            <div className="icon-item">
                                                <i className={`bi ${category.icon} me-2`} style={{ fontSize: "2rem", color: category.color }}></i>
                                                <div className="icon-text" style={{ color: category.color }}>
                                                    {category.category_name}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="carousel-item">
                                <div className="icon-menu d-flex justify-content-between align-items-center flex-wrap mt-4">
                                    {categories.slice(5, 10).map((category) => (
                                        <Link to={`/category?id=${category._id}`} key={category._id} className="text-center">
                                            <div className="icon-item">
                                                <i className={`bi ${category.icon} me-2`} style={{ fontSize: "2rem", color: category.color }}></i>
                                                <div className="icon-text" style={{ color: category.color }}>
                                                    {category.category_name}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Previous Button */}
                        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators2" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                        </button>

                        {/* Next Button */}
                        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators2" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </div>

                    {/* Product Cards */}
                    <div className="container mt-4">
                    <div className="mb-4">
  <select
    id="filterOptions"
    value={filter}
    onChange={handleFilter}
    style={{
      backgroundColor: '#f8f9fa', // Light background
      border: '1px solid #ced4da', // Border color
      borderRadius: '0.25rem', // Rounded corners
      padding: '0.375rem 1.75rem 0.375rem 0.75rem', // Padding adjustments
      appearance: 'none', // Remove default arrow
      backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'currentColor\' class=\'bi bi-chevron-down\' viewBox=\'0 0 16 16\'><path fill-rule=\'evenodd\' d=\'M1.5 4.5a.5.5 0 0 1 .8-.6L8 8.793l5.7-4.9a.5.5 0 1 1 .6.8l-6 5.25a.5.5 0 0 1-.6 0l-6-5.25a.5.5 0 0 1-.1-.6z\'/></svg>")', // Custom arrow
      backgroundRepeat: 'no-repeat', // Don't repeat the background
      backgroundPosition: 'right 0.75rem center', // Position the arrow
      backgroundSize: '1rem', // Size of the arrow
      cursor: 'pointer' // Change cursor to pointer on hover
    }}
  >
    <option value="">Chọn...</option>
    <option value="topAsc">Giá Thấp Nhất</option>
    <option value="topDesc">Giá Cao Nhất</option>
  </select>
</div>

                        <div className="row">
                            {/* Use topProducts if there is a filter, otherwise use products */}
                            {(filter ? topProducts : products).length > 0 ? (
                                (filter ? topProducts : products).map((product) => (
                                    <div className="col-md-3 mb-4" key={product._id}>
                                        <div className="card product-card">
                                            <img
                                                src={`http://localhost:5000/${product.image}`} // Path to image from server
                                                className="card-img-top"
                                                alt={product.product_name}
                                            />
                                            <div className="card-body">
                                                <Link to={`/detailsProduct?id=${product._id}`}>
                                                    <h6 className="card-title">{product.product_name}</h6>
                                                </Link>
                                                <div className="d-flex">
                                                    <div className="rating text-warning me-2">★★★★★</div>
                                                </div>
                                                <p className="product-price mt-2">{product.money} VND</p>
                                                {product.discount_amount > 0 && (
                                                    <>
                                                        <p className="old-price">
                                                            {(product.money / (1 - product.discount_amount / 100)).toFixed(0)} VND
                                                        </p>
                                                        <p className="text-danger">-{product.discount_amount}%</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center">Không có sản phẩm nào.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
