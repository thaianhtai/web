import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeaderComponent from "./components/HeaderComponent/HeaderComponent";
import DefaultComponent from "./components/DefaultComponent/DefaultComponent";
import { routes } from "./routes";


function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState(null);
  const [searchedProducts, setSearchedProducts] = useState([]); // State để lưu sản phẩm tìm kiếm

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const handleLoginSuccess = (username) => {
    setUser({ username });
    closeModals();
  };

  const updateSearchedProducts = (products) => {
    setSearchedProducts(products); // Cập nhật sản phẩm tìm kiếm
  };

  return (
    <Router>
      <HeaderComponent
        showLoginModal={showLoginModal}
        showRegisterModal={showRegisterModal}
        setShowLoginModal={setShowLoginModal}
        setShowRegisterModal={setShowRegisterModal}
        closeModals={closeModals}
        openLoginModal={openLoginModal}
        openRegisterModal={openRegisterModal}
        user={user}
        setUser={setUser}
        handleLoginSuccess={handleLoginSuccess}
        updateSearchedProducts={updateSearchedProducts} // Truyền hàm cập nhật sản phẩm tìm kiếm
      />

      <Routes>
        {routes.map((route) => {
          const Page = route.page;
          const Layout = route.isShowHeader ? DefaultComponent : React.Fragment;

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Layout>
                <Page user={user} setUser={setUser} openLoginModal={openLoginModal} searchedProducts={searchedProducts} />
              </Layout>
              }
            />
          );
        })}
      </Routes>
    </Router>
  );
}

export default App;
