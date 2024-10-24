import AdminPage from "../pages/Admin/AdminPage";
import CartPage from "../pages/CartPage/CartPage";
import CategoryProducts from "../pages/CategoryProducts/CategoryProducts";
import HistoryPage from "../pages/HistoryPage/HistoryPage";
import HomePage from "../pages/HomePage/HomePage";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage";
import OrderPage from "../pages/OrderPage/OrderPage";
import ProductsPage from "../pages/ProductsPage/ProductsPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";

export const routes = [
  {
    path: "/",
    page: HomePage,
    isShowHeader: true,
  },
  {
    path: "/order",
    page: OrderPage,
    isShowHeader: true,
  },
  {
    path: "/admin",
    page: AdminPage,
    isShowHeader: true,
  },
  {
    path: "/category",  // Dynamic route to handle category selection
    page: CategoryProducts,
    isShowHeader: true,
  },
  {
    path: "/detailsProduct",
    page: ProductsPage,
        isShowHeader: true
  },
  {
    path: "/historyOrder",
    page: HistoryPage,
        isShowHeader: true
  },
  {
    path: "/profile",
    page: ProfilePage,
        isShowHeader: true
  },
  {
    path: "/cart",
    page: CartPage,
        isShowHeader: true
  },
  {
    path: "*",
    page: NotFoundPage,
  },
];
