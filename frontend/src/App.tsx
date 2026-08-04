import HomePage from "./pages/HomePage";
import { Routes, Route } from "react-router-dom";
import OrdersPage from "./pages/OrdersPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/orders/:section?" element={<OrdersPage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;
