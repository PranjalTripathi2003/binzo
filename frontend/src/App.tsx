import HomePage from "./pages/HomePage";
import { Routes, Route } from "react-router-dom";
import OrdersPage from "./pages/OrdersPage";

function App() {
  return <Routes>
    <Route path="/" element = {<HomePage/>}/>
    <Route path="/orders" element = {<OrdersPage/>}/>

  </Routes>;
}

export default App;
